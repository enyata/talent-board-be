import AppDataSource from "@src/datasource";
import { ExperienceLevel } from "@src/entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { OnboardingService } from "@src/onboarding/onboarding.service";
import { EntityManager } from "typeorm";

jest.mock("@src/datasource", () => ({
  manager: {
    findOne: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("OnboardingService - Local User Refactor", () => {
  let onboardingService: OnboardingService;
  let mockManager: Partial<EntityManager>;
  let mockGetOneOrFail: jest.Mock;

  const userId = "user-id-1";

  const talentDto = {
    first_name: "John",
    last_name: "Doe",
    state: "Lagos",
    country: "Nigeria",
    portfolio_url: "https://portfolio.com",
    linkedin_profile: "https://linkedin.com/in/sample",
    resume_path: "uploads/resumes/sample.pdf",
    skills: ["Node.js", "TypeScript"],
    experience_level: ExperienceLevel.INTERMEDIATE,
    job_title: "Software Engineer",
    bio: "Passionate developer",
  };

  const recruiterDto = {
    first_name: "Jane",
    last_name: "Smith",
    state: "Lagos",
    country: "Nigeria",
    linkedin_profile: "https://linkedin.com/in/sample",
    work_email: "recruiter@company.com",
    company_industry: "Tech",
    roles_looking_for: ["Frontend Developer", "Backend Developer"],
    hiring_for: "my company",
  };

  beforeEach(() => {
    onboardingService = new OnboardingService();
    mockGetOneOrFail = jest.fn().mockResolvedValue({ profile_completed: true });

    mockManager = {
      save: jest.fn(),
      create: jest.fn().mockImplementation((_, data) => data),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOneOrFail: mockGetOneOrFail,
        where: jest.fn().mockReturnThis(),
      }),
    };

    (AppDataSource.manager.transaction as jest.Mock).mockImplementation((cb) =>
      cb(mockManager),
    );
    jest.clearAllMocks();
  });

  it("should onboard a new talent successfully", async () => {
    const user = {
      id: userId,
      profile_completed: false,
      provider: UserProvider.GOOGLE,
      first_name: "John",
      last_name: "Doe",
    } as UserEntity;

    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(user);

    mockGetOneOrFail.mockResolvedValue({
      ...user,
      role: UserRole.TALENT,
      profile_completed: true,
      talent_profile: {},
    });

    const result = await onboardingService.onboardUser(
      userId,
      talentDto,
      UserRole.TALENT,
    );

    expect(result.profile_completed).toBe(true);
    expect(mockManager.save).toHaveBeenCalled();
  });

  it("should throw ClientError if first_name is missing for a Local user", async () => {
    const localUserId = "local-user-id";
    const mockUser = {
      id: localUserId,
      provider: UserProvider.LOCAL,
      is_email_verified: true,
      first_name: null,
      last_name: null,
      profile_completed: false,
    } as UserEntity;

    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(mockUser);

    const incompletePayload = {
      state: "Lagos",
      country: "Nigeria",
      linkedin_profile: "https://linkedin.com/in/test",
    } as any;

    await expect(
      onboardingService.onboardUser(
        localUserId,
        incompletePayload,
        UserRole.RECRUITER,
      ),
    ).rejects.toThrow(
      new ClientError("First name is required to complete onboarding"),
    );
  });

  it("should successfully onboard Local user when names are provided in payload", async () => {
    const localUserId = "local-user-id";
    const mockUser = {
      id: localUserId,
      provider: UserProvider.LOCAL,
      is_email_verified: true,
      first_name: null,
      last_name: null,
      profile_completed: false,
    } as UserEntity;

    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(mockUser);

    mockGetOneOrFail.mockResolvedValue({
      ...mockUser,
      first_name: "John",
      last_name: "Doe",
      profile_completed: true,
    });

    const result = await onboardingService.onboardUser(
      localUserId,
      recruiterDto as any,
      UserRole.RECRUITER,
    );

    expect(result.profile_completed).toBe(true);
    expect(mockUser.first_name).toBe("Jane");
    expect(mockUser.last_name).toBe("Smith");
  });

  it("should throw NotFoundError if user is not found", async () => {
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      onboardingService.onboardUser(userId, talentDto as any, UserRole.TALENT),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError if user is already onboarded", async () => {
    const onboardedUser = { id: userId, profile_completed: true } as UserEntity;
    (AppDataSource.manager.findOne as jest.Mock).mockResolvedValue(
      onboardedUser,
    );

    await expect(
      onboardingService.onboardUser(userId, talentDto as any, UserRole.TALENT),
    ).rejects.toThrow(ConflictError);
  });
});
