import { NextFunction, Request, Response } from "express";
import { UserRole } from "../../entities/user.entity";
import { onboardTalent } from "../../onboarding/onboarding.controller";
import { OnboardingService } from "../../onboarding/onboarding.service";
import * as tokenUtils from "../../utils/createSendToken";

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    manager: { mocked: "manager" },
  },
}));

jest.mock("@src/onboarding/onboarding.service");

const mockOnboardTalent = jest.fn();
const mockCreateSendToken = jest.fn();

describe("onboardTalent controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    (OnboardingService as jest.Mock).mockImplementation(() => {
      return { onboardTalent: mockOnboardTalent };
    });

    jest
      .spyOn(tokenUtils, "createSendToken")
      .mockImplementation(mockCreateSendToken);

    mockReq = {
      user: { id: "mock-user-id", role: UserRole.TALENT },
      file: {
        fieldname: "resume",
        originalname: "resume.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        destination: "uploads/resumes/",
        filename: "mock-resume.pdf",
        path: "uploads/resumes/mock-resume.pdf",
        size: 12345,
        stream: {} as any,
        buffer: Buffer.from(""),
      },
      body: {
        location: "Lagos",
        portfolio_url: "https://portfolio.com",
        linkedin_profile: "https://linkedin.com/in/sample",
        skills: ["Node.js", "TypeScript"],
        experience_level: "intermediate",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it("should onboard a new talent and send token", async () => {
    const mockUser = { id: "mock-user-id", email: "test@example.com" };
    mockOnboardTalent.mockResolvedValue(mockUser);

    await onboardTalent(mockReq as Request, mockRes as Response, mockNext);

    expect(mockOnboardTalent).toHaveBeenCalled();
    const calledArgs = mockOnboardTalent.mock.calls[0];

    expect(calledArgs[0]).toBe("mock-user-id");
    expect(calledArgs[1]).toMatchObject({
      location: "Lagos",
      portfolio_url: "https://portfolio.com",
      linkedin_profile: "https://linkedin.com/in/sample",
      skills: ["Node.js", "TypeScript"],
      experience_level: "intermediate",
      resume_path: "uploads/resumes/mock-resume.pdf",
    });

    expect(mockCreateSendToken).toHaveBeenCalledWith(
      mockUser,
      200,
      "Talent onboarded successfully",
      mockReq,
      mockRes,
      { mocked: "manager" },
    );
  });
});
