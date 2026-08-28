import { UserEntity, UserProvider } from "@src/entities/user.entity";
import { getInitialIncompleteSignupReminderDate } from "@src/utils/email/incompleteSignupReminderSchedule";
import log from "@src/utils/logger";
import { EntityManager } from "typeorm";
import { GoogleProfile } from "./google.interface";

export class GoogleAuthService {
  async authenticateOrCreateUser(
    profileData: GoogleProfile,
    entityManager: EntityManager,
  ): Promise<UserEntity> {
    const { email } = profileData;

    return await entityManager.transaction(async (tx) => {
      let user = await tx.findOne(UserEntity, {
        where: { email },
      });

      if (!user) {
        user = tx.create(UserEntity, {
          ...profileData,
          provider: UserProvider.GOOGLE,
          profile_completed: false,
          incomplete_signup_next_reminder_at:
            getInitialIncompleteSignupReminderDate(),
          incomplete_signup_last_reminder_at: null,
          incomplete_signup_reminder_count: 0,
        });
        await tx.save(user);
        log.info("New user registered via Google");
      } else {
        log.info("Existing user logged in via Google");
      }

      return user;
    });
  }
}
