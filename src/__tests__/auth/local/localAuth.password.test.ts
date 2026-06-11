import * as argon2 from "argon2";
import config from "config";
import { LocalAuthService } from "../auth/local/local.service";
import { PasswordResetTokenEntity } from "../entities/passwordResetToken.entity";
import { UserEntity, UserProvider } from "../entities/user.entity";
import { ClientError } from "../exceptions/clientError";
import { NotFoundError } from "../exceptions/notFoundError";
import { EmailService } from "../utils/email";

jest.mock("../utils/email");
jest.mock("argon2");
jest.mock("config");

describe("LocalAuthService - Password Reset Logic", () => {
  let service: LocalAuthService;
  let mockManager: any;

  beforeEach(() => {
    service = new LocalAuthService();
    mockManager = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      transaction: jest.fn((cb) => cb(mockManager)),
    };
    jest.clearAllMocks();

    // Default config mocks to prevent "property not defined" errors from node-config
    (config.has as jest.Mock).mockReturnValue(true);
    (config.get as jest.Mock).mockImplementation((key: string) => {
      if (key === "PASSWORD_RESET_COOLDOWN_SECONDS") return 120;
      if (key === "PASSWORD_RESET_TOKEN_TTL_MINUTES") return 30;
      if (key === "FRONTEND_URL") return "http://localhost:3000";
      return null;
    });
  });

  describe("forgotPassword", () => {
    const email = "user@example.com";

    it("should throw NotFoundError if the user is not found", async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.forgotPassword(email, mockManager)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw ClientError if the user is a social login user", async () => {
      mockManager.findOne.mockResolvedValueOnce({
        email,
        provider: UserProvider.GOOGLE,
      });

      await expect(service.forgotPassword(email, mockManager)).rejects.toThrow(
        ClientError,
      );
    });

    it("should throw ClientError if requested within the cooldown period", async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ email, provider: UserProvider.LOCAL }) // User lookup
        .mockResolvedValueOnce({ created_at: new Date() }); // Last token (cooldown active)

      await expect(service.forgotPassword(email, mockManager)).rejects.toThrow(
        /Please wait/,
      );
    });

    it("should generate a token, hash it, and send a reset email if valid", async () => {
      mockManager.findOne
        .mockResolvedValueOnce({
          id: "user-123",
          email,
          provider: UserProvider.LOCAL,
        }) // User lookup
        .mockResolvedValueOnce(null); // No recent token

      (argon2.hash as jest.Mock).mockResolvedValue("hashed-token");
      mockManager.create.mockReturnValue({ token: "hashed-token" });

      await service.forgotPassword(email, mockManager);

      expect(mockManager.update).toHaveBeenCalledWith(
        PasswordResetTokenEntity,
        { email, used_at: expect.anything() },
        { expires_at: expect.anything() },
      );
      expect(mockManager.save).toHaveBeenCalled();
      expect(EmailService.sendPasswordReset).toHaveBeenCalledWith(
        email,
        expect.stringContaining("token="),
        expect.any(Number),
      );
    });
  });

  describe("resetPassword", () => {
    const payload = {
      email: "user@example.com",
      token: "raw-token",
      password: "NewSecurePassword1!",
    };

    it("should throw ClientError if no valid token record is found", async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.resetPassword(payload, mockManager)).rejects.toThrow(
        "Invalid or expired token.",
      );
    });

    it("should throw ClientError if the token is expired", async () => {
      mockManager.findOne.mockResolvedValueOnce({
        expires_at: new Date(Date.now() - 1000), // In the past
      });

      await expect(service.resetPassword(payload, mockManager)).rejects.toThrow(
        "Invalid or expired token.",
      );
    });

    it("should throw ClientError if argon2 token verification fails", async () => {
      mockManager.findOne.mockResolvedValueOnce({
        expires_at: new Date(Date.now() + 60000),
        token: "stored-hash",
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.resetPassword(payload, mockManager)).rejects.toThrow(
        "Invalid or expired token.",
      );
    });

    it("should update password via partial update and mark token as used", async () => {
      const tokenRecord = {
        id: "token-uuid",
        token: "stored-hash",
        expires_at: new Date(Date.now() + 60000),
      };
      const userRecord = { id: "user-uuid", email: payload.email };

      mockManager.findOne
        .mockResolvedValueOnce(tokenRecord) // Token lookup
        .mockResolvedValueOnce(userRecord); // User lookup

      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue("new-hashed-password");

      await service.resetPassword(payload, mockManager);

      // Critical: Ensure we use update() to bypass profile validation
      expect(mockManager.update).toHaveBeenCalledWith(
        UserEntity,
        { id: userRecord.id },
        { password: "new-hashed-password" },
      );

      // Check token management
      expect(tokenRecord).toHaveProperty("used_at");
      expect(mockManager.save).toHaveBeenCalledWith(tokenRecord);
    });
  });
});
