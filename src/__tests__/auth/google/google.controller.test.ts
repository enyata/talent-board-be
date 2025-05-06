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
  query: {
    state: "http://localhost:3000",
  },
} as unknown as Request;

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  locals: {},
} as unknown as Response;

const mockNext = jest.fn();

(AppDataSource.manager as any) = { transaction: jest.fn((fn) => fn({})) };

describe("googleOAuthCallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      GoogleAuthService.prototype.authenticateOrCreateUser as jest.Mock
    ).mockResolvedValue(mockUser);
    (createTokenUtil.createSendToken as jest.Mock).mockImplementation(
      async (_user, _status, _msg, _req, res, _tx, options) => {
        res.locals.access_token = "test-access-token";
        res.locals.refresh_token = "test-refresh-token";
        options?.mode === "redirect" &&
          res.redirect(
            `${_req.query.state}?access_token=${res.locals.access_token}&refresh_token=${res.locals.refresh_token}`,
          );
      },
    );
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
      { mode: "redirect" },
    );

    expect(mockRes.redirect).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000"),
    );
  });

  it("should call next with UnauthorizedError if user is missing", async () => {
    const badReq = { ...mockReq, user: null } as unknown as Request;
    await googleOAuthCallback(badReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
