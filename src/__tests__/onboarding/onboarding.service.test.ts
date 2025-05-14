import { Repository } from "typeorm";
import AppDataSource from "../../datasource";
import { ExperienceLevel } from "../../entities/talentProfile.entity";
import { UserEntity, UserRole } from "../../entities/user.entity";
import { ConflictError } from "../../exceptions/conflictError";
import { NotFoundError } from "../../exceptions/notFoundError";
import { OnboardingService } from "../../onboarding/onboarding.service";

jest.mock("@src/datasource", () => {
  const actual = jest.requireActual("@src/datasource");
  return {
    ...actual,
    getRepository: jest.fn(),
  };
});

describe("OnboardingService", () => {
  let service: OnboardingService;
  let mockRepo: Partial<Repository<UserEntity>>;

  const userId = "user-id-1";

  const talentDto = {
    state: "Lagos",
    country: "Nigeria",
    portfolio_url: "https://portfolio.com",
    linkedin_profile: "https://linkedin.com/in/sample",
    resume_path: "uploads/resumes/sample.pdf",
    skills: ["Node.js", "TypeScript"],
    experience_level: ExperienceLevel.INTERMEDIATE,
  };

  const recruiterDto = {
    state: "Lagos",
    country: "Nigeria",
    linkedin_profile: "https://linkedin.com/in/sample",
    work_email: "recruiter@company.com",
    company_industry: "Tech",
    roles_looking_for: ["Frontend Developer", "Backend Developer"],
  };

  beforeEach(() => {
    service = new OnboardingService();
    (AppDataSource as any).manager = {
      findOne: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
    };
  });

  it("should onboard a new talent successfully", async () => {
    const user = { id: userId, profile_completed: false } as UserEntity;
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(user);
    (AppDataSource.manager.save as jest.Mock).mockImplementation(
      (input) => input,
    );
    (AppDataSource.manager.findOneOrFail as jest.Mock).mockResolvedValue({
      ...user,
      role: UserRole.TALENT,
      profile_completed: true,
      talent_profile: {},
    });

    const result = await service.onboardUser(
      userId,
      talentDto,
      UserRole.TALENT,
    );

    expect(result.role).toBe(UserRole.TALENT);
    expect(result.profile_completed).toBe(true);
  });

  it("should onboard a new recruiter successfully", async () => {
    const user = { id: userId, profile_completed: false } as UserEntity;
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(user);
    (AppDataSource.manager.save as jest.Mock).mockImplementation(
      (input) => input,
    );
    (AppDataSource.manager.findOneOrFail as jest.Mock).mockResolvedValue({
      ...user,
      role: UserRole.RECRUITER,
      profile_completed: true,
      recruiter_profile: {},
    });

    const result = await service.onboardUser(
      userId,
      recruiterDto,
      UserRole.RECRUITER,
    );

    expect(result.role).toBe(UserRole.RECRUITER);
    expect(result.profile_completed).toBe(true);
  });

  it("should throw NotFoundError if user is not found", async () => {
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.onboardUser(userId, talentDto, UserRole.TALENT),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError if user is already onboarded", async () => {
    const onboardedUser = { id: userId, profile_completed: true } as UserEntity;
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(
      onboardedUser,
    );

    await expect(
      service.onboardUser(userId, talentDto, UserRole.TALENT),
    ).rejects.toThrow(ConflictError);
  });
});
