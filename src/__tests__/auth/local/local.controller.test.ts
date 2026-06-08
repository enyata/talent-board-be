import * as controller from "../../../auth/local/local.controller";
import { LocalAuthService } from "../../../auth/local/local.service";
import { ClientError } from "../../../exceptions/clientError";
import { ConflictError } from "../../../exceptions/conflictError";
import { NotFoundError } from "../../../exceptions/notFoundError";
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

  describe("resendOtp", () => {
    const email = "test@example.com";

    it("should return 200 on successful resend", async () => {
      req = mockRequest({ email });
      jest
        .spyOn(LocalAuthService.prototype, "resendOtp")
        .mockResolvedValueOnce();

      await controller.resendOtp(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: expect.stringContaining("If an account exists"),
      });
    });

    it("should return 200 even if user not found (anti-enumeration)", async () => {
      req = mockRequest({ email: "missing@example.com" });
      jest
        .spyOn(LocalAuthService.prototype, "resendOtp")
        .mockRejectedValueOnce(new NotFoundError("User not found"));

      await controller.resendOtp(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: expect.stringContaining("If an account exists"),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 200 for social login users (anti-enumeration)", async () => {
      req = mockRequest({ email: "google-user@example.com" });
      jest
        .spyOn(LocalAuthService.prototype, "resendOtp")
        .mockRejectedValueOnce(
          new ClientError("This account uses social login"),
        );

      await controller.resendOtp(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should forward other errors (like cooldown) to next", async () => {
      req = mockRequest({ email });
      const cooldownError = new ClientError("Please wait 60 seconds");
      jest
        .spyOn(LocalAuthService.prototype, "resendOtp")
        .mockRejectedValueOnce(cooldownError);

      await controller.resendOtp(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(cooldownError);
    });
  });
});
