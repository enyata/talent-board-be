import AppDataSource from "@src/datasource";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { TalentOnboardingDTO } from "./schemas/talentOnboarding.schema";

export class OnboardingService {
  async onboardTalent(userId: string, payload: TalentOnboardingDTO) {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.profile_completed) {
      throw new ConflictError("Onboarding already completed");
    }

    Object.assign(user, {
      ...payload,
      role: UserRole.TALENT,
      profile_completed: true,
    });

    return await userRepo.save(user);
  }
}
