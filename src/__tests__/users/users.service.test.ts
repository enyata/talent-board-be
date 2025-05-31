import AppDataSource from "../../datasource";
import { UserEntity, UserRole } from "../../entities/user.entity";
import { NotFoundError } from "../../exceptions/notFoundError";
import { UserService } from "../../users/users.service";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    getRepository: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
    resolveAssetUrl: jest.fn((path) => `http://localhost:8000/${path}`),
  },
}));

const mockRepo = {
  findOne: jest.fn(),
};

(AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
const mockManager = AppDataSource.manager;

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

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      const mockUser = {
        id: "1",
        first_name: "Jane",
        last_name: "Doe",
        avatar: "old-avatar.png",
        role: UserRole.TALENT,
        talent_profile: { bio: "Old bio" },
      } as UserEntity;

      (mockManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const payload = {
        first_name: "John",
        last_name: "Smith",
        avatar: "new-avatar.png",
        bio: "Updated bio",
      };

      const result = await service.updateProfile(
        mockUser.id,
        mockUser.role,
        payload,
      );

      expect(mockManager.findOne).toHaveBeenCalledWith(UserEntity, {
        where: { id: mockUser.id },
        relations: ["talent_profile", "recruiter_profile"],
      });

      expect(mockUser.first_name).toBe("John");
      expect(mockUser.last_name).toBe("Smith");
      expect(mockUser.avatar).toBe("new-avatar.png");
      expect(mockUser.talent_profile.bio).toBe("Updated bio");

      expect(mockManager.save).toHaveBeenCalledWith(mockUser);
      expect(mockManager.save).toHaveBeenCalledWith(mockUser.talent_profile);

      expect(result).toEqual({
        id: mockUser.id,
        first_name: "John",
        last_name: "Smith",
        avatar: resolveAssetUrl("new-avatar.png"),
        bio: "Updated bio",
      });
    });

    it("should throw NotFoundError if user is not found", async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProfile("1", UserRole.TALENT, {
          first_name: "John",
          last_name: "Smith",
          avatar: "new-avatar.png",
          bio: "Updated bio",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
