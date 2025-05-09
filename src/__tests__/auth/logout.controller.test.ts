import { logoutUser } from "../../auth/auth.controller";
import { RefreshToken } from "../../entities/refreshToken.entity";

jest.mock("@src/datasource", () => {
  const updateMock = jest.fn();
  return {
    __esModule: true,
    default: {
      manager: {
        update: updateMock,
      },
    },
    __mocks__: {
      updateMock,
    },
  };
});

const { __mocks__ } = require("@src/datasource");
const updateMock = __mocks__.updateMock;

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
};

const mockNext = jest.fn();

describe("AuthController - logoutUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should invalidate refresh token and clear cookie", async () => {
    const req = {
      cookies: {
        refreshToken: "mocked_refresh_token",
      },
      secure: true,
      headers: {},
    } as any;

    const res = mockResponse();

    await logoutUser(req, res, mockNext);

    expect(updateMock).toHaveBeenCalledWith(
      RefreshToken,
      { token: "mocked_refresh_token", is_valid: true },
      { is_valid: false },
    );

    expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", {
      httpOnly: true,
      secure: true,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User logged out successfully",
    });
  });

  it("should handle case where no refresh token is present", async () => {
    const req = {
      cookies: {},
      secure: false,
      headers: {},
    } as any;

    const res = mockResponse();

    await logoutUser(req, res, mockNext);

    expect(updateMock).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", {
      httpOnly: true,
      secure: false,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User logged out successfully",
    });
  });
});
