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

import { SkillsService } from "@src/skills/skills.service";

export class OnboardingService {
  private skillsService = new SkillsService();

  async onboardUser(
    userId: string,
    payload: OnboardingPayload,
    role: UserRole,
  ): Promise<UserEntity> {
    const manager = AppDataSource.manager;
    const user = await manager.findOne(UserEntity, {
      where: { id: userId },
    });

    if (!user) throw new NotFoundError("User not found");
    if (user.profile_completed)
      throw new ConflictError("Onboarding already completed");

    // Use transaction to ensure atomicity
    return await manager.transaction(async (transactionalEntityManager) => {
      user.state = payload.state;
      user.country = payload.country;
      user.linkedin_profile = payload.linkedin_profile;
      user.role = role;
      user.profile_completed = true;

      await transactionalEntityManager.save(user);

      if (role === UserRole.TALENT) {
        const p = payload as TalentPayload;

        const skillEntities = await this.skillsService.findOrCreateSkills(
          p.skills || [],
          transactionalEntityManager,
        );

        const profile = transactionalEntityManager.create(TalentProfileEntity, {
          user,
          resume_path: p.resume_path,
          portfolio_url: p.portfolio_url,
          skills: skillEntities,
          experience_level: p.experience_level as ExperienceLevel,
          profile_status: ProfileStatus.APPROVED,
          bio: p.bio,
          job_title: p.job_title,
        });
        await transactionalEntityManager.save(profile);
      }

      if (role === UserRole.RECRUITER) {
        const p = payload as RecruiterPayload;
        const profile = transactionalEntityManager.create(
          RecruiterProfileEntity,
          {
            user,
            work_email: p.work_email,
            company_industry: p.company_industry,
            roles_looking_for: p.roles_looking_for,
            hiring_for: p.hiring_for as HiringFor,
          },
        );
        await transactionalEntityManager.save(profile);
      }

      return await transactionalEntityManager
        .createQueryBuilder(UserEntity, "user")
        .leftJoinAndSelect("user.talent_profile", "talent_profile")
        .leftJoinAndSelect("talent_profile.skills", "skills")
        .leftJoinAndSelect("user.recruiter_profile", "recruiter_profile")
        .where("user.id = :id", { id: user.id })
        .getOneOrFail();
    });
  }
}
