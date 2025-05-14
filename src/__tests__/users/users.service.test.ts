import AppDataSource from "../../datasource";
import { UserEntity } from "../../entities/user.entity";
import { NotFoundError } from "../../exceptions/notFoundError";
import { UserService } from "../../users/users.service";

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    getRepository: jest.fn(),
  },
}));

const mockRepo = {
  findOne: jest.fn(),
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

describe("UserService", () => {
  const service = new UserService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return sanitized user if found", async () => {
      const mockUser = { id: "1", email: "jane@example.com" } as UserEntity;
      mockRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser("1");
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
        relations: ["talent_profile", "recruiter_profile"],
      });
      expect(result).toBeDefined();
    });

    it("should throw NotFoundError if user not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getCurrentUser("1")).rejects.toThrow(NotFoundError);
    });
  });
});
