import { Request, Response } from "express";
import AppDataSource from "../../datasource";
import { UserEntity } from "../../entities/user.entity";
import { deserializeUser } from "../../middlewares/deserializeUser";
import { signToken, verifyToken } from "../../utils/jwt";

jest.mock("@src/utils/jwt");
jest.mock("@src/entities/user.entity");
jest.mock("@src/entities/refreshToken.entity");
jest.mock("@src/datasource");

const mockReq = {} as Request;
const mockRes = {
  setHeader: jest.fn(),
  cookie: jest.fn(),
} as unknown as Response;
const mockNext = jest.fn();

const mockUser = {
  id: "user-id-123",
  email: "john@example.com",
  first_name: "John",
  last_name: "Doe",
  avatar: null,
};

describe("deserializeUser middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNext.mockClear();
  });

  it("should attach user to request if access token is valid", async () => {
    (verifyToken as jest.Mock).mockImplementation((token, _) =>
      token === "valid-access" ? { id: mockUser.id } : null,
    );

    (UserEntity.findOne as jest.Mock).mockResolvedValue(mockUser);

    const req = {
      headers: { authorization: "Bearer valid-access" },
      cookies: {},
    } as unknown as Request;

    await deserializeUser(req, mockRes, mockNext);
    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should refresh token and attach user if access is invalid but refresh is valid", async () => {
    (verifyToken as jest.Mock).mockImplementation((token, key) => {
      if (token === "valid-refresh" && key === "REFRESH_TOKEN_PUBLIC_KEY")
        return { id: mockUser.id };
      if (token.startsWith("new-access")) return { id: mockUser.id };
      return null;
    });

    (UserEntity.findOne as jest.Mock).mockResolvedValue(mockUser);

    const entityManagerMock = {
      findOne: jest
        .fn()
        .mockResolvedValue({ token: "valid-refresh", is_valid: true }),
      save: jest.fn(),
    };
    (AppDataSource.manager as any) = entityManagerMock;

    (signToken as jest.Mock).mockImplementation((id, key) =>
      key.includes("access") ? "new-access-token" : "new-refresh-token",
    );

    const req = {
      headers: {},
      cookies: { refresh_token: "valid-refresh" },
      secure: false,
    } as unknown as Request;

    await deserializeUser(req, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "x-access-token",
      "new-access-token",
    );
    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should throw if no tokens are provided", async () => {
    const req = {
      headers: {},
      cookies: {},
    } as unknown as Request;

    const next = jest.fn();
    await deserializeUser(req, mockRes, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toMatch(/Missing tokens/);
  });

  it("should throw if refresh token is invalid", async () => {
    (verifyToken as jest.Mock).mockReturnValue(null);

    const req = {
      headers: {},
      cookies: { refresh_token: "invalid" },
    } as unknown as Request;

    await deserializeUser(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0].message).toMatch(/Invalid refresh token/);
  });
});
