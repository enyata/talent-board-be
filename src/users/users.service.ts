import AppDataSource from "@src/datasource";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { resolveAssetUrl } from "@src/utils/resolveAssetUrl";
import { sanitizeUser } from "@src/utils/sanitizeUser";
import { UpdateProfileDTO } from "./schemas/updateProfile.schema";

export class UserService {
  private userRepo = AppDataSource.getRepository(UserEntity);

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["talent_profile", "recruiter_profile"],
    });
    if (!user) throw new NotFoundError("User not found");

    return sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    role: UserRole,
    payload: UpdateProfileDTO,
  ) {
    const manager = AppDataSource.manager;

    const user = await manager.findOne(UserEntity, {
      where: { id: userId },
      relations: ["talent_profile", "recruiter_profile"],
    });

    if (!user) throw new NotFoundError("User not found");

    user.first_name = payload.first_name;
    user.last_name = payload.last_name;
    if (payload.avatar) user.avatar = payload.avatar;

    await manager.save(user);

    if (role === UserRole.TALENT && payload.bio) {
      user.talent_profile.bio = payload.bio;
      await manager.save(user.talent_profile);
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: resolveAssetUrl(user.avatar),
      bio: user.talent_profile?.bio,
    };
  }
}
