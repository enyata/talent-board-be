import * as controller from "../../../auth/local/local.controller";
import { LocalAuthService } from "../../../auth/local/local.service";
import { ConflictError } from "../../../exceptions/conflictError";
import { UnauthorizedError } from "../../../exceptions/unauthorizedError";
import { createSendToken } from "../../../utils/createSendToken";

jest.mock("../../../utils/createSendToken", () => ({
  createSendToken: jest.fn(),
}));

const mockRequest = (body: any) => ({ body }) as any;
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("LocalAuthController", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    res = mockResponse();
    mockNext.mockClear();
    jest.clearAllMocks();
  });

  it("should return 201 and user data on successful signup", async () => {
    req = mockRequest({
      email: "john.doe@example.com",
      password: "Password1!",
      confirm_password: "Password1!",
    });

    jest.spyOn(LocalAuthService.prototype, "signup").mockResolvedValueOnce({
      id: "user-123",
      email: "john.doe@example.com",
      is_email_verified: false,
    } as any);

    await controller.signupUser(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Signup successful.",
      data: {
        id: "user-123",
        email: "john.doe@example.com",
        is_email_verified: false,
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should forward duplicate user errors to next", async () => {
    req = mockRequest({
      email: "john.doe@example.com",
      password: "Password1!",
      confirm_password: "Password1!",
    });

    jest
      .spyOn(LocalAuthService.prototype, "signup")
      .mockRejectedValueOnce(new ConflictError("User already exists"));

    await controller.signupUser(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
  });

  describe("verifyEmail", () => {
    it("should return tokens when OTP is valid", async () => {
      const email = "john.doe@example.com";
      const otp = "123456";
      req = mockRequest({ email, otp });

      const mockUser = {
        id: "user-123",
        email,
        is_email_verified: true,
      } as any;
      jest
        .spyOn(LocalAuthService.prototype, "verifyEmail")
        .mockResolvedValueOnce(mockUser);

      await controller.verifyEmail(req, res, mockNext);

      expect(createSendToken).toHaveBeenCalledWith(
        mockUser,
        200,
        "Email verified Successfully",
        req,
        res,
        expect.any(Object),
      );
    });

    it("should return 400 when OTP is invalid or expired", async () => {
      req = mockRequest({ email: "test@example.com", otp: "000000" });
      jest
        .spyOn(LocalAuthService.prototype, "verifyEmail")
        .mockResolvedValueOnce(null);

      await controller.verifyEmail(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired OTP",
      });
    });
  });

  describe("loginUser", () => {
    it("should return tokens on successful login", async () => {
      const email = "john.doe@example.com";
      const password = "Password1!";
      req = mockRequest({ email, password });

      const mockUser = {
        id: "user-123",
        email,
        is_email_verified: true,
      } as any;
      jest
        .spyOn(LocalAuthService.prototype, "login")
        .mockResolvedValueOnce(mockUser);

      await controller.loginUser(req, res, mockNext);

      expect(createSendToken).toHaveBeenCalledWith(
        mockUser,
        200,
        "Login successful",
        req,
        res,
        expect.any(Object),
      );
    });

    it("should forward login errors to next", async () => {
      req = mockRequest({ email: "test@example.com", password: "wrong" });
      const error = new UnauthorizedError("Invalid email or password");
      jest
        .spyOn(LocalAuthService.prototype, "login")
        .mockRejectedValueOnce(error);

      await controller.loginUser(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
