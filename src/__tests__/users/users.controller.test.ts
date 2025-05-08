import { NotFoundError } from "../../exceptions/notFoundError";
import { getCurrentUser } from "../../users/users.controller";
import * as userServiceModule from "../../users/users.service";

const mockRequest = (id: string) => ({ user: { id } }) as any;
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("UserController", () => {
  describe("getCurrentUser", () => {
    let req: any, res: any;

    beforeEach(() => {
      req = mockRequest("user-id-123");
      res = mockResponse();
      mockNext.mockClear();
    });

    it("should respond with the user data", async () => {
      const mockUser = { id: "user-id-123", email: "test@example.com" };

      jest
        .spyOn(userServiceModule.UserService.prototype, "getCurrentUser")
        .mockResolvedValueOnce(mockUser);

      await getCurrentUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "User fetched successfully",
        data: { user: mockUser },
      });
    });

    it("should handle service failure and propagate error", async () => {
      req = mockRequest("invalid-id");

      jest
        .spyOn(userServiceModule.UserService.prototype, "getCurrentUser")
        .mockRejectedValueOnce(new NotFoundError("User not found"));

      await getCurrentUser(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
