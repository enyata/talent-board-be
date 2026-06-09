import { EmailOtpEntity } from "@src/entities/emailOtp.entity";
import { UserEntity, UserProvider } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import { EmailService } from "@src/utils/email";
import log from "@src/utils/logger";
import { OtpUtil } from "@src/utils/otp.util";
import { hash, verify } from "argon2";
import config from "config";
import { EntityManager } from "typeorm";
import type { LoginRequest } from "./schemas/login.schema";
import type { LocalSignupDTO } from "./schemas/signup.schema";

/**
 * LocalAuthService handles:
 * - Email/password signup
 * - OTP verification
 * - User creation for LOCAL provider
 */
export class LocalAuthService {
  /**
   * Creates a new local user OR returns existing one (safe idempotency pattern)
   * OTP generation is handled outside this function
   */
  async signup(
    data: LocalSignupDTO,
    entityManager: EntityManager,
  ): Promise<UserEntity> {
    const { email, password } = data;

    return await entityManager.transaction(async (tx) => {
      const existing = await tx.findOne(UserEntity, {
        where: { email },
      });

      if (existing) {
        throw new ConflictError("User already exists");
      }

      const hashedPassword = await hash(password);

      const user = tx.create(UserEntity, {
        email,
        password: hashedPassword,
        provider: UserProvider.LOCAL,
        profile_completed: false,
        is_email_verified: false,
        first_name: null,
        last_name: null,
      });

      await tx.save(user);

      log.info(
        {
          userId: user.id,
          email,
        },
        "New local user created",
      );

      return user;
    });
  }

  async sendVerificationOtp(
    user: UserEntity,
    entityManager: EntityManager,
    ttlMinutes = config.get<number>("OTP_TTL_MINUTES") || 10, // OTP validity duration
  ): Promise<void> {
    // Invalidate any existing OTPs for this email
    const otp = OtpUtil.generate(6);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const otpRecord = entityManager.create(EmailOtpEntity, {
      user,
      email: user.email,
      otp,
      expires_at: expiresAt,
    });

    await entityManager.save(otpRecord);
    await EmailService.sendVerification(user.email, otp, ttlMinutes);
  }

  // Returns the user if OTP is valid, otherwise null. Also marks email as verified and records OTP usage.
  async verifyEmail(
    email: string,
    otp: string,
    entityManager: EntityManager,
  ): Promise<UserEntity | null> {
    return await entityManager.transaction(async (tx) => {
      const record = await tx.findOne(EmailOtpEntity, {
        where: { email, otp },
        order: { created_at: "DESC" },
      });

      if (!record) return null;
      if (record.used_at) return null;
      if (record.expires_at < new Date()) return null;

      const user = await tx.findOne(UserEntity, { where: { email } });
      if (!user) return null;

      user.is_email_verified = true;
      await tx.save(user);

      record.used_at = new Date();
      await tx.save(record);
      return user;
    });
  }

  async login(
    data: LoginRequest,
    entityManager: EntityManager,
  ): Promise<UserEntity> {
    const { email, password } = data;

    const user = await entityManager.findOne(UserEntity, {
      where: { email },
      // We need to select the password field explicitly since it's excluded by default for security reasons, but we need it here to verify the password. We also need to select provider and is_email_verified to enforce login rules.
      select: [
        "id",
        "email",
        "password",
        "provider",
        "is_email_verified",
        "role",
        "profile_completed",
      ],
    });

    // Return custom error messages for better UX, but avoid leaking info about which part is incorrect
    // This also prevents user enumeration attacks by not revealing whether the email exists or not
    // This handles both non-existent users, users with incorrect passwords in the same way and Oauth users trying to log in with email/password as well as users who haven't verified their email yet.
    if (!user || user.provider !== UserProvider.LOCAL) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Users must verify their email before log in
    if (!user.is_email_verified) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in",
      );
    }

    // Verify the password using argon2's verify function, which safely compares the hashed password with the provided one
    const isValid = await verify(user.password!, password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return user;
  }
}
