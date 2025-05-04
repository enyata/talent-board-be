import AppDataSource from "@src/datasource";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";

export class OnboardingService {
  async onboardUser<T extends Partial<UserEntity>>(
    userId: string,
    payload: T,
    role: UserRole,
  ): Promise<UserEntity> {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundError("User not found");
    if (user.profile_completed)
      throw new ConflictError("Onboarding already completed");

    Object.assign(user, {
      ...payload,
      role,
      profile_completed: true,
    });

    return await userRepo.save(user);
  }
}
