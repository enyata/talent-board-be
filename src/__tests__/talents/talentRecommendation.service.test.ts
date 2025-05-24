import { DataSource } from "typeorm";
import AppDataSource from "../../datasource";
import {
  HiringFor,
  RecruiterProfileEntity,
} from "../../entities/recruiterProfile.entity";
import { SavedTalentEntity } from "../../entities/savedTalent.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../../entities/user.entity";
import { TalentRecommendationService } from "../../talents/services/talentRecommendation.service";

let dataSource: DataSource;
const service = new TalentRecommendationService();

describe("TalentRecommendationService", () => {
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM "saved_talents"`);
    await dataSource.query(`DELETE FROM "notifications"`);
    await dataSource.query(`DELETE FROM "talent_profiles"`);
    await dataSource.query(`DELETE FROM "recruiter_profiles"`);
    await dataSource.query(`DELETE FROM "users"`);
  });

  beforeAll(async () => {
    dataSource = await AppDataSource.initialize();
  });

  afterAll(async () => {
    const entityManager = AppDataSource.manager;

    await entityManager.query(`DELETE FROM "saved_talents"`);
    await entityManager.query(`DELETE FROM "notifications"`);
    await entityManager.query(`DELETE FROM "talent_profiles"`);
    await entityManager.query(`DELETE FROM "recruiter_profiles"`);
    await entityManager.query(`DELETE FROM "users"`);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("should return recommended talents ranked by match score", async () => {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const talentRepo = AppDataSource.getRepository(TalentProfileEntity);
    const savedTalentRepo = AppDataSource.getRepository(SavedTalentEntity);
    const recruiterProfileRepo = AppDataSource.getRepository(
      RecruiterProfileEntity,
    );

    const recruiter = userRepo.create({
      first_name: "Recruiter",
      last_name: "One",
      email: "recruiter@example.com",
      provider: UserProvider.GOOGLE,
      role: UserRole.RECRUITER,
      state: "Lagos",
      country: "Nigeria",
    });
    const savedRecruiter = await userRepo.save(recruiter);

    const recruiterProfile = recruiterProfileRepo.create({
      user: savedRecruiter,
      roles_looking_for: ["React", "Node.js"],
      work_email: "recruiter@hiring.com",
      company_industry: "Software and Data",
      hiring_for: HiringFor.MYSELF,
    });
    await recruiterProfileRepo.save(recruiterProfile);

    const talentAUser = userRepo.create({
      first_name: "TalentA",
      last_name: "Dev",
      email: "talentA@example.com",
      provider: UserProvider.GOOGLE,
      role: UserRole.TALENT,
      state: "Lagos",
      country: "Nigeria",
      profile_completed: true,
    });
    const savedTalentAUser = await userRepo.save(talentAUser);

    const talentAProfile = talentRepo.create({
      user: savedTalentAUser,
      skills: ["React", "Node.js"],
      experience_level: ExperienceLevel.EXPERT,
      resume_path: "path/to/talent_a.pdf",
      profile_status: ProfileStatus.APPROVED,
      skills_text: "react,node.js",
    });
    await talentRepo.save(talentAProfile);

    const talentBUser = userRepo.create({
      first_name: "TalentB",
      last_name: "Junior",
      email: "talentB@example.com",
      provider: UserProvider.GOOGLE,
      role: UserRole.TALENT,
      state: "Abuja",
      country: "Nigeria",
      profile_completed: true,
    });
    const savedTalentBUser = await userRepo.save(talentBUser);

    const talentBProfile = talentRepo.create({
      user: savedTalentBUser,
      skills: ["HTML", "CSS"],
      experience_level: ExperienceLevel.ENTRY,
      resume_path: "path/to/talent_b.pdf",
      profile_status: ProfileStatus.APPROVED,
      skills_text: "html,css",
    });
    await talentRepo.save(talentBProfile);

    const talentCUser = userRepo.create({
      first_name: "TalentC",
      last_name: "Hidden",
      email: "talentC@example.com",
      provider: UserProvider.GOOGLE,
      role: UserRole.TALENT,
      state: "Lagos",
      country: "Nigeria",
      profile_completed: true,
    });
    const savedTalentCUser = await userRepo.save(talentCUser);

    const talentCProfile = talentRepo.create({
      user: savedTalentCUser,
      skills: ["Python", "Django"],
      experience_level: ExperienceLevel.INTERMEDIATE,
      resume_path: "path/to/talent_c.pdf",
      profile_status: ProfileStatus.APPROVED,
      skills_text: "python,django",
    });
    await talentRepo.save(talentCProfile);

    const existingRecruiter = await userRepo.findOne({
      where: { id: savedRecruiter.id },
      relations: ["recruiter_profile"],
    });
    const existingTalentC = await userRepo.findOne({
      where: { id: savedTalentCUser.id },
      relations: ["talent_profile"],
    });

    if (
      !existingRecruiter ||
      !existingTalentC ||
      !existingTalentC.talent_profile
    ) {
      throw new Error("Recruiter or Talent does not exist or lacks a profile.");
    }

    await savedTalentRepo.save(
      savedTalentRepo.create({
        recruiter: existingRecruiter,
        talent: existingTalentC, // Talent C is saved, should be excluded
        saved_at: new Date(),
      }),
    );

    const existingTalentA = await talentRepo.findOne({
      where: { id: talentAProfile.id },
      relations: ["user"],
    });
    const existingTalentB = await talentRepo.findOne({
      where: { id: talentBProfile.id },
      relations: ["user"],
    });

    if (!existingTalentA || !existingTalentB) {
      throw new Error("One or more talents are missing from the database.");
    }

    const results = await service.recommendTalents(savedRecruiter.id);

    expect(results).toHaveLength(2); // Only TalentA and TalentB should be recommended
    expect(results[0].user.first_name).toBe("TalentA"); // Highest match
    expect(results[1].user.first_name).toBe("TalentB"); // Lower match
  });
});
