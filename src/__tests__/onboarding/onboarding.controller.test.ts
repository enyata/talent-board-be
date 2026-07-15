import { NextFunction, Request, Response } from "express";
import { HiringFor } from "../../entities/recruiterProfile.entity";
import { UserRole } from "../../entities/user.entity";
import {
  onboardRecruiter,
  onboardTalent,
} from "../../onboarding/onboarding.controller";
import { OnboardingService } from "../../onboarding/onboarding.service";
import * as tokenUtils from "../../utils/createSendToken";
import { EmailService } from "../../utils/email";

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    manager: { mocked: "manager" },
  },
}));

const mockOnboardUser = jest.fn();
const mockCreateSendToken = jest.fn();
const mockSendWelcome = jest.fn();

describe("onboard controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(OnboardingService.prototype, "onboardUser")
      .mockImplementation(mockOnboardUser);

    jest
      .spyOn(tokenUtils, "createSendToken")
      .mockImplementation(mockCreateSendToken);

    jest.spyOn(EmailService, "sendWelcome").mockImplementation(mockSendWelcome);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it("should onboard a new talent and send token", async () => {
    mockReq = {
      user: { id: "mock-user-id", role: UserRole.TALENT },
      file: { path: "uploads/resumes/mock-resume.pdf" } as Express.Multer.File,
      body: {
        state: "Lagos",
        country: "Nigeria",
        portfolio_url: "https://portfolio.com",
        linkedin_profile: "https://linkedin.com/in/sample",
        skills: ["Node.js", "TypeScript"],
        experience_level: "intermediate",
      },
    };

    const mockUser = { id: "mock-user-id", email: "test@example.com" };
    mockOnboardUser.mockResolvedValue(mockUser);

    await onboardTalent(mockReq as Request, mockRes as Response, mockNext);

    const [userIdArg, payloadArg, roleArg] = mockOnboardUser.mock.calls[0];

    expect(userIdArg).toBe("mock-user-id");
    expect(payloadArg.resume_path).toBe("uploads/resumes/mock-resume.pdf");
    expect(roleArg).toBe(UserRole.TALENT);
    expect(mockCreateSendToken).toHaveBeenCalledWith(
      mockUser,
      200,
      "Talent onboarded successfully",
      mockReq,
      mockRes,
      { mocked: "manager" },
    );
    expect(mockSendWelcome).toHaveBeenCalledWith(
      "test@example.com",
      "http://localhost:3000/dashboard",
      "there",
      "talent",
    );
  });

  it("should onboard a new recruiter and send token", async () => {
    mockReq = {
      user: { id: "mock-user-id", role: UserRole.RECRUITER },
      body: {
        state: "Abuja",
        country: "Nigeria",
        linkedin_profile: "https://linkedin.com/in/sample",
        work_email: "recruiter@company.com",
        company_industry: "Tech",
        roles_looking_for: ["Frontend Developer", "Backend Developer"],
        hiring_for: HiringFor.MYSELF,
      },
    };

    const mockUser = { id: "mock-user-id", email: "recruiter@company.com" };
    mockOnboardUser.mockResolvedValue(mockUser);

    await onboardRecruiter(mockReq as Request, mockRes as Response, mockNext);

    const [userIdArg, payloadArg, roleArg] = mockOnboardUser.mock.calls[0];

    expect(userIdArg).toBe("mock-user-id");
    expect(roleArg).toBe(UserRole.RECRUITER);
    expect(mockCreateSendToken).toHaveBeenCalledWith(
      mockUser,
      200,
      "Recruiter onboarded successfully",
      mockReq,
      mockRes,
      { mocked: "manager" },
    );
    expect(mockSendWelcome).toHaveBeenCalledWith(
      "recruiter@company.com",
      "http://localhost:3000/dashboard",
      "there",
      "recruiter",
    );
  });
});
