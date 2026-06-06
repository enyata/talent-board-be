import { LocalAuthService } from "@src/auth/local/local.service";
import { EmailOtpEntity } from "@src/entities/emailOtp.entity";
import { UserEntity } from "@src/entities/user.entity";
import { EmailService } from "@src/utils/email";
import { EntityManager } from "typeorm";

jest.mock("@src/utils/email", () => ({
  EmailService: {
    sendVerification: jest.fn().mockResolvedValue({}),
  },
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
      update: jest.fn(),
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
});
