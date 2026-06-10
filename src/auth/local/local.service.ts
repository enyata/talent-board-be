import { EmailOtpEntity } from "@src/entities/emailOtp.entity";
import { PasswordResetTokenEntity } from "@src/entities/passwordResetToken.entity";
import { UserEntity, UserProvider } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import { EmailService } from "@src/utils/email";
import log from "@src/utils/logger";
import { OtpUtil } from "@src/utils/otp.util";
import { hash, verify } from "argon2";
import config from "config";
import crypto from "crypto";
import { EntityManager, IsNull } from "typeorm";
import type { ResetPasswordPayload } from "./local.interface";
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
    ttlMinutes = config.has("OTP_TTL_MINUTES")
      ? config.get<number>("OTP_TTL_MINUTES")
      : 10, // OTP validity duration
  ): Promise<void> {
    // Invalidate any existing unused OTPs for this email to ensure only the latest one is valid
    await entityManager.update(
      EmailOtpEntity,

      { email: user.email, used_at: IsNull() },
      { expires_at: new Date() },
    );

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

      // Validation checks: record must exist, not be used, and should not be expired
      if (!record) return null;
      if (record.used_at) return null;
      if (record.expires_at < new Date()) return null;

      const user = await tx.findOne(UserEntity, { where: { email } });

      // Only allow verification for LOCAL users
      if (!user || user.provider !== UserProvider.LOCAL) return null;

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

  async resendOtp(email: string, entityManager: EntityManager): Promise<void> {
    const cooldownSeconds = config.has("OTP_RESEND_COOLDOWN_SECONDS")
      ? config.get<number>("OTP_RESEND_COOLDOWN_SECONDS")
      : 60;
    const user = await entityManager.findOne(UserEntity, { where: { email } });

    if (!user) throw new NotFoundError("User not found");
    if (user.is_email_verified)
      throw new ClientError("Email is already verified");

    // Only LOCAL users should have OTPs. If the user exists but isn't LOCAL,
    if (user.provider !== UserProvider.LOCAL) {
      throw new ClientError(
        "This account uses social login and does not require verification.",
      );
    }

    // Check for cooldown to prevent spamming
    const lastOtp = await entityManager.findOne(EmailOtpEntity, {
      where: { email },
      order: { created_at: "DESC" },
    });

    if (lastOtp) {
      // Calculate seconds since last OTP was created for cooldown enforcement
      const secondsSinceLastOtp =
        (Date.now() - lastOtp.created_at.getTime()) / 1000;
      if (secondsSinceLastOtp < cooldownSeconds) {
        throw new ClientError(
          `Please wait ${Math.ceil(cooldownSeconds - secondsSinceLastOtp)} seconds before requesting a new code.`,
        );
      }
    }

    await this.sendVerificationOtp(user, entityManager);
  }

  /**
   * Initiates the password reset process by generating a secure token and sending an email.
   */
  async forgotPassword(
    email: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const user = await entityManager.findOne(UserEntity, { where: { email } });

    if (!user) throw new NotFoundError("User not found");

    // Only local users can reset their password via email
    if (user.provider !== UserProvider.LOCAL) {
      throw new ClientError(
        "This account uses social login. Please use your social login provider to access your account.",
      );
    }

    // Check for cooldown to prevent spamming
    const lastToken = await entityManager.findOne(PasswordResetTokenEntity, {
      where: { email },
      order: { created_at: "DESC" },
    });

    if (lastToken) {
      const cooldownSeconds = config.has("PASSWORD_RESET_COOLDOWN_SECONDS")
        ? config.get<number>("PASSWORD_RESET_COOLDOWN_SECONDS")
        : 120; // 2 minutes default
      const secondsSinceLastToken =
        (Date.now() - lastToken.created_at.getTime()) / 1000;
      if (secondsSinceLastToken < cooldownSeconds) {
        throw new ClientError(
          `Please wait ${Math.ceil(cooldownSeconds - secondsSinceLastToken)} seconds before requesting a new link.`,
        );
      }
    }

    // Invalidate any existing unused reset tokens for this email to ensure only the latest is valid
    await entityManager.update(
      PasswordResetTokenEntity,
      { email, used_at: IsNull() },
      { expires_at: new Date() },
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await hash(rawToken);

    // Store the hashed token in the database with an expiration time, and send the raw token to the user's email.
    // The user will provide the raw token when resetting their password, and we will verify it against the hashed version in the database.
    const ttlMinutes = config.has("PASSWORD_RESET_TOKEN_TTL_MINUTES")
      ? config.get<number>("PASSWORD_RESET_TOKEN_TTL_MINUTES")
      : 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const resetRecord = entityManager.create(PasswordResetTokenEntity, {
      user,
      email,
      token: hashedToken,
      expires_at: expiresAt,
    });

    await entityManager.save(resetRecord);

    const frontendUrl = config.get<string>("FRONTEND_URL");
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await EmailService.sendPasswordReset(email, resetLink, ttlMinutes);
  }

  /**
   * Resets the user's password after verifying the provided token.
   */
  async resetPassword(
    data: ResetPasswordPayload,
    entityManager: EntityManager,
  ): Promise<void> {
    const { email, token, password } = data;

    await entityManager.transaction(async (tx) => {
      const record = await tx.findOne(PasswordResetTokenEntity, {
        where: { email, used_at: IsNull() },
        order: { created_at: "DESC" },
      });

      const sanitizedToken = token.trim();

      log.debug(
        {
          email: data.email,
          recordFound: !!record,
          expiresAt: record?.expires_at,
          currentTime: new Date(),
          recordCreatedAt: record?.created_at,
        },
        "Attempting password reset token lookup and expiration check",
      );

      if (!record || record.expires_at < new Date()) {
        log.warn(
          { email: data.email },
          "Password reset token not found or expired.",
        );
        throw new ClientError("Invalid or expired token.");
      }

      log.debug(
        {
          email: data.email,
          dbHashLength: record.token.length,
          receivedTokenLength: sanitizedToken.length,
          dbHashedTokenPrefix: record.token.substring(0, 15) + "...",
          receivedRawTokenPrefix: sanitizedToken.substring(0, 15) + "...",
        },
        "Attempting password reset token verification",
      );
      const isValid = await verify(record.token, sanitizedToken);
      if (!isValid) {
        log.warn(
          { email: data.email },
          "Password reset token verification failed for email.",
        );
        throw new ClientError("Invalid or expired token.");
      }

      const user = await tx.findOne(UserEntity, { where: { email } });
      if (!user) throw new NotFoundError("User not found");

      // Hash the new password and update the user's password in the database. Also mark the token as used by setting used_at to the current timestamp.
      const hashedPassword = await hash(password);
      await tx.update(
        UserEntity,
        { id: user.id },
        { password: hashedPassword },
      );

      record.used_at = new Date();
      await tx.save(record);
    });
  }
}
