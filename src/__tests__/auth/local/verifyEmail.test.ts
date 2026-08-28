import { LocalAuthService } from "@src/auth/local/local.service";
import { EmailOtpEntity } from "@src/entities/emailOtp.entity";
import { UserEntity, UserProvider } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import { EmailService } from "@src/utils/email";
import { EntityManager } from "typeorm";
jest.mock("@src/utils/email", () => ({
  EmailService: {
    sendVerification: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

describe("LocalAuthService - Email Verification", () => {
  let authService: LocalAuthService;
  let mockManager: Partial<EntityManager>;

  beforeEach(() => {
    authService = new LocalAuthService();
    mockManager = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((entity, data) => data),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    jest.clearAllMocks();
  });

  describe("sendVerificationOtp", () => {
    it("should generate an OTP, save it, and send an email", async () => {
      const mockUser = {
        id: "user-uuid",
        email: "test@example.com",
      } as UserEntity;

      await authService.sendVerificationOtp(
        mockUser,
        mockManager as EntityManager,
      );

      expect(mockManager.update).toHaveBeenCalledWith(
        EmailOtpEntity,
        { email: "test@example.com", used_at: expect.anything() },
        { expires_at: expect.any(Date) },
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        EmailOtpEntity,
        expect.objectContaining({
          email: "test@example.com",
          otp: expect.any(String),
          expires_at: expect.any(Date),
        }),
      );
      expect(mockManager.save).toHaveBeenCalled();
      expect(EmailService.sendVerification).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringMatching(/^\d{6}$/), // Verify 6-digit numeric string
        expect.any(Number),
      );
    });
  });

  describe("verifyEmail", () => {
    const email = "test@example.com";
    const otp = "123456";

    it("should return the user and mark email as verified for a valid OTP", async () => {
      const mockOtpRecord = {
        email,
        otp,
        expires_at: new Date(Date.now() + 10000), // Valid in the future
        used_at: null,
      };
      const mockUser = { email, is_email_verified: false } as UserEntity;

      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOtpRecord) // First call for EmailOtpEntity
        .mockResolvedValueOnce(mockUser); // Second call for UserEntity

      const result = await authService.verifyEmail(
        email,
        otp,
        mockManager as EntityManager,
      );

      expect(result).toBeDefined();
      expect(mockUser.is_email_verified).toBe(true);
      expect(mockOtpRecord.used_at).toBeInstanceOf(Date);
      expect(mockManager.save).toHaveBeenCalledWith(mockUser);
      expect(mockManager.save).toHaveBeenCalledWith(mockOtpRecord);
    });

    it("should return null if the OTP record does not exist", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await authService.verifyEmail(
        email,
        "wrong-otp",
        mockManager as EntityManager,
      );

      expect(result).toBeNull();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it("should return null if the OTP has expired", async () => {
      const mockOtpRecord = {
        email,
        otp,
        expires_at: new Date(Date.now() - 10000), // Expired in the past
      };

      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockOtpRecord);

      const result = await authService.verifyEmail(
        email,
        otp,
        mockManager as EntityManager,
      );

      expect(result).toBeNull();
    });

    it("should return null if the OTP has already been used", async () => {
      const mockOtpRecord = {
        email,
        otp,
        expires_at: new Date(Date.now() + 10000),
        used_at: new Date(), // Already used
      };

      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockOtpRecord);

      const result = await authService.verifyEmail(
        email,
        otp,
        mockManager as EntityManager,
      );

      expect(result).toBeNull();
    });

    it("should return null if the user is not found", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        expires_at: new Date(Date.now() + 10000),
      });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null); // User not found

      const result = await authService.verifyEmail(
        email,
        otp,
        mockManager as EntityManager,
      );
      expect(result).toBeNull();
    });
  });

  describe("resendOtp", () => {
    const email = "test@example.com";

    it("should successfully resend OTP if conditions are met", async () => {
      const mockUser = {
        email,
        is_email_verified: false,
        provider: UserProvider.LOCAL,
      } as UserEntity;

      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockUser) // User find
        .mockResolvedValueOnce(null); // lastOtp find (no cooldown)

      const sendOtpSpy = jest
        .spyOn(authService, "sendVerificationOtp")
        .mockResolvedValueOnce();

      await authService.resendOtp(email, mockManager as EntityManager);

      expect(sendOtpSpy).toHaveBeenCalledWith(mockUser, mockManager);
    });

    it("should throw NotFoundError if user does not exist", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ClientError if user is already verified", async () => {
      const mockUser = { email, is_email_verified: true } as UserEntity;
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(ClientError);
    });

    it("should throw ClientError if user is not LOCAL provider", async () => {
      const mockUser = {
        email,
        is_email_verified: false,
        provider: UserProvider.GOOGLE,
      } as UserEntity;
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(ClientError);
      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(/social login/);
    });

    it("should throw ClientError if within cooldown period", async () => {
      const mockUser = {
        email,
        is_email_verified: false,
        provider: UserProvider.LOCAL,
      } as UserEntity;

      const lastOtp = {
        created_at: new Date(Date.now() - 30 * 1000), // 30 seconds ago
      };

      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockUser) // User check
        .mockResolvedValueOnce(lastOtp); // Cooldown check

      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(ClientError);
      await expect(
        authService.resendOtp(email, mockManager as EntityManager),
      ).rejects.toThrow(/Please wait/);
    });
  });

  describe("login", () => {
    const email = "test@example.com";
    const password = "Password1!";

    it("should return user if credentials are valid", async () => {
      const mockUser = {
        id: "1",
        email,
        password: "hashedPassword",
        provider: UserProvider.LOCAL,
        is_email_verified: true,
      } as UserEntity;

      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (verify as jest.Mock).mockResolvedValueOnce(true);

      const result = await authService.login(
        { email, password },
        mockManager as EntityManager,
      );

      expect(result).toEqual(mockUser);
      expect(verify).toHaveBeenCalledWith("hashedPassword", password);
    });

    it("should throw UnauthorizedError if user not found", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        authService.login({ email, password }, mockManager as EntityManager),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if provider is not LOCAL", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        provider: UserProvider.GOOGLE,
      });

      await expect(
        authService.login({ email, password }, mockManager as EntityManager),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if email is not verified", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        provider: UserProvider.LOCAL,
        is_email_verified: false,
      });

      await expect(
        authService.login({ email, password }, mockManager as EntityManager),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        provider: UserProvider.LOCAL,
        is_email_verified: true,
        password: "hash",
      });
      (verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        authService.login({ email, password }, mockManager as EntityManager),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
