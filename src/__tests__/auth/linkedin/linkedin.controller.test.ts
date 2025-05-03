import { Request, Response } from "express";
import {
  linkedInOAuth,
  linkedInOAuthCallback,
} from "../../../auth/linkedin/linkedin.controller";
import { LinkedInAuthService } from "../../../auth/linkedin/linkedin.service";
import AppDataSource from "../../../datasource";
import * as createTokenUtil from "../../../utils/createSendToken";

jest.mock("@src/auth/linkedin/linkedin.service");
jest.mock("@src/utils/createSendToken");

const mockUser = { id: "user-789", email: "linked.in@example.com" };
const mockReq = {
  user: {
    first_name: "Link",
    last_name: "Edin",
    email: "linked.in@example.com",
    avatar: "https://avatar.com/link.png",
  } as unknown,
} as Partial<Request> as Request;

const mockRes = {
  redirect: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
} as unknown as Response;

const mockNext = jest.fn();
(AppDataSource.manager as any) = { transaction: jest.fn((fn) => fn({})) };

describe("LinkedIn OAuth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      LinkedInAuthService.prototype.authenticateOrCreateUser as jest.Mock
    ).mockResolvedValue(mockUser);
  });

  it("should redirect to LinkedIn auth URL", () => {
    linkedInOAuth({} as Request, mockRes);
    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://www.linkedin.com/oauth/v2/authorization",
      ),
    );
  });

  it("should respond with success and tokens", async () => {
    await linkedInOAuthCallback(mockReq, mockRes, mockNext);

    expect(
      LinkedInAuthService.prototype.authenticateOrCreateUser,
    ).toHaveBeenCalledWith(mockReq.user, AppDataSource.manager);

    expect(createTokenUtil.createSendToken).toHaveBeenCalledWith(
      mockUser,
      200,
      "LinkedIn OAuth successful",
      mockReq,
      mockRes,
      AppDataSource.manager,
    );
  });

  it("should call next with UnauthorizedError if user is missing", async () => {
    const badReq = { ...mockReq, user: null } as unknown as Request;
    await linkedInOAuthCallback(badReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
