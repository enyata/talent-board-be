import AppDataSource from "@src/datasource";
import {
  HiringFor,
  RecruiterProfileEntity,
} from "@src/entities/recruiterProfile.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "@src/entities/talentProfile.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import {
  OnboardingPayload,
  RecruiterPayload,
  TalentPayload,
} from "@src/interfaces";
export class OnboardingService {
  async onboardUser(
    userId: string,
    payload: OnboardingPayload,
    role: UserRole,
  ): Promise<UserEntity> {
    const manager = AppDataSource.manager;
    const user = await manager.findOne(UserEntity, {
      where: { id: userId },
      relations: ["talent_profile", "recruiter_profile"],
    });

    if (!user) throw new NotFoundError("User not found");
    if (user.profile_completed)
      throw new ConflictError("Onboarding already completed");

    user.state = payload.state;
    user.country = payload.country;
    user.linkedin_profile = payload.linkedin_profile;
    user.role = role;
    user.profile_completed = true;

    await manager.save(user);

    if (role === UserRole.TALENT) {
      const p = payload as TalentPayload;
      const profile = manager.create(TalentProfileEntity, {
        user,
        resume_path: p.resume_path,
        portfolio_url: p.portfolio_url,
        skills: p.skills,
        experience_level: p.experience_level as ExperienceLevel,
        profile_status: ProfileStatus.APPROVED,
        bio: p.bio,
        skills_text: p.skills ? p.skills.join(" ") : "",
      });
      await manager.save(profile);
    }

    if (role === UserRole.RECRUITER) {
      const p = payload as RecruiterPayload;
      const profile = manager.create(RecruiterProfileEntity, {
        user,
        work_email: p.work_email,
        company_industry: p.company_industry,
        roles_looking_for: p.roles_looking_for,
        hiring_for: p.hiring_for as HiringFor,
      });
      await manager.save(profile);
    }

    return await manager.findOneOrFail(UserEntity, {
      where: { id: user.id },
      relations: ["talent_profile", "recruiter_profile"],
    });
  }
}
