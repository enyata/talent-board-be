import { LocalAuthController } from "../../../auth/local/local.controller";
import { LocalAuthService } from "../../../auth/local/local.service";
import { ConflictError } from "../../../exceptions/conflictError";

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

    const controller = new LocalAuthController(new LocalAuthService());
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

    const controller = new LocalAuthController(new LocalAuthService());
    await controller.signupUser(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ConflictError));
  });
});
