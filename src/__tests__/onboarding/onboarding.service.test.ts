// src/__tests__/onboarding/onboarding.service.test.ts
import { Repository } from "typeorm";
import AppDataSource from "../../datasource";
import {
  ExperienceLevel,
  UserEntity,
  UserRole,
} from "../../entities/user.entity";
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
  const dto = {
    location: "Lagos",
    portfolio_url: "https://portfolio.com",
    linkedin_profile: "https://linkedin.com/in/sample",
    resume_path: "uploads/resumes/sample.pdf",
    skills: ["Node.js", "TypeScript"],
    experience_level: ExperienceLevel.INTERMEDIATE as ExperienceLevel,
  };

  beforeEach(() => {
    service = new OnboardingService();
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  it("should onboard a new talent successfully", async () => {
    const user = { id: userId, profile_completed: false } as UserEntity;
    (mockRepo.findOne as jest.Mock).mockResolvedValue(user);
    (mockRepo.save as jest.Mock).mockImplementation((input) => input);

    const result = await service.onboardTalent(userId, dto);

    expect(result.role).toBe(UserRole.TALENT);
    expect(result.profile_completed).toBe(true);
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ...dto,
        role: UserRole.TALENT,
        profile_completed: true,
      }),
    );
  });

  it("should throw NotFoundError if user is not found", async () => {
    (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.onboardTalent(userId, dto)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("should throw ConflictError if user is already onboarded", async () => {
    const onboardedUser = { id: userId, profile_completed: true } as UserEntity;
    (mockRepo.findOne as jest.Mock).mockResolvedValue(onboardedUser);

    await expect(service.onboardTalent(userId, dto)).rejects.toThrow(
      ConflictError,
    );
  });
});
