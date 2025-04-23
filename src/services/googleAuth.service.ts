import { EntityManager } from "typeorm";
import { UserEntity } from "../entities/user.entity";
import { GoogleProfile } from "../interfaces";
import log from "../utils/logger";

export class GoogleAuthService {
  async authenticateOrCreateUser(
    profile: GoogleProfile,
    entityManager: EntityManager,
  ): Promise<UserEntity> {
    return await entityManager.transaction(async (tx) => {
      let user = await tx.findOne(UserEntity, {
        where: { email: profile.email },
      });

      if (!user) {
        user = tx.create(UserEntity, {
          ...profile,
          provider: "google",
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
