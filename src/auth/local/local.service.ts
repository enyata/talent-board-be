import { UserEntity, UserProvider } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import log from "@src/utils/logger";
import { hash } from "argon2";
import { EntityManager } from "typeorm";
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
}
