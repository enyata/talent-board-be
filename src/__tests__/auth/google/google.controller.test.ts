import { Request, Response } from "express";
import { googleOAuthCallback } from "../../../auth/google/google.controller";
import { GoogleAuthService } from "../../../auth/google/google.service";
import AppDataSource from "../../../datasource";
import * as createTokenUtil from "../../../utils/createSendToken";

jest.mock("../../../auth/google/google.service");
jest.mock("../../../utils/createSendToken.ts");

const mockUser = { id: "user-123", email: "jane.doe@example.com" };
const mockReq = {
  user: {
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    avatar: "https://avatar.com/jane.png",
  },
} as Partial<Request> as Request;

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
} as unknown as Response;

const mockNext = jest.fn();

(AppDataSource.manager as any) = { transaction: jest.fn((fn) => fn({})) };

describe("googleOAuthCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      GoogleAuthService.prototype.authenticateOrCreateUser as jest.Mock
    ).mockResolvedValue(mockUser);
  });

  it("should respond with success and tokens", async () => {
    await googleOAuthCallback(mockReq, mockRes, mockNext);

    expect(
      GoogleAuthService.prototype.authenticateOrCreateUser,
    ).toHaveBeenCalledWith(mockReq.user, AppDataSource.manager);

    expect(createTokenUtil.createSendToken).toHaveBeenCalledWith(
      mockUser,
      200,
      "Google OAuth successful",
      mockReq,
      mockRes,
      AppDataSource.manager,
    );
  });

  it("should call next with UnauthorizedError if user is missing", async () => {
    const badReq = { ...mockReq, user: null } as unknown as Request;
    await googleOAuthCallback(badReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
