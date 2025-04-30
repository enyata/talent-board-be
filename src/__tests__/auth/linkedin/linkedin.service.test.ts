import { EntityManager } from "typeorm";
import { LinkedInProfile } from "../../../auth/linkedin/linkedin.interface";
import { LinkedInAuthService } from "../../../auth/linkedin/linkedin.service";
import { UserProvider } from "../../../entities/user.entity";

const mockManager = {
  transaction: jest.fn(),
};

describe("LinkedInAuthService", () => {
  const service = new LinkedInAuthService();
  const profile: LinkedInProfile = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    avatar: "https://avatar.com/john.png",
  };

  beforeEach(() => jest.clearAllMocks());

  it("should return existing user if found", async () => {
    const existingUser = { id: "abc-123", email: profile.email };
    mockManager.transaction.mockImplementation(async (cb) =>
      cb({
        findOne: jest.fn().mockResolvedValue(existingUser),
      }),
    );

    const result = await service.authenticateOrCreateUser(
      profile,
      mockManager as unknown as EntityManager,
    );

    expect(result).toEqual({
      id: "abc-123",
      email: "john.doe@example.com",
    });
  });

  it("should create new user if not found", async () => {
    const savedUser = {
      id: "xyz-789",
      ...profile,
      provider: UserProvider.LINKEDIN,
    };

    mockManager.transaction.mockImplementation(async (cb) =>
      cb({
        findOne: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockReturnValue(savedUser),
        save: jest.fn().mockResolvedValue(savedUser),
      }),
    );

    const result = await service.authenticateOrCreateUser(
      profile,
      mockManager as unknown as EntityManager,
    );

    expect(result).toMatchObject({
      id: "xyz-789",
      email: "john.doe@example.com",
    });
  });
});
