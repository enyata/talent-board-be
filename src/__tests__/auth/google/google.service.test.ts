import { EntityManager } from "typeorm";
import { GoogleProfile } from "../../../auth/google/google.interface";
import { GoogleAuthService } from "../../../auth/google/google.service";

jest.mock("../../../utils/sanitizeUser", () => ({
  sanitizeUser: jest.fn((user) => ({ id: user.id, email: user.email })),
}));

const mockManager = {
  transaction: jest.fn(),
};

describe("GoogleAuthService", () => {
  const service = new GoogleAuthService();
  const profile: GoogleProfile = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    avatar: "http://avatar.com/john.png",
  };

  beforeEach(() => jest.clearAllMocks());

  it("should return existing user if found", async () => {
    const existingUser = {
      id: "abc-123",
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar: profile.avatar,
    };

    mockManager.transaction.mockImplementation(async (cb) =>
      cb({ findOne: jest.fn().mockResolvedValue(existingUser) }),
    );

    const result = await service.authenticateOrCreateUser(
      profile,
      mockManager as unknown as EntityManager,
    );

    expect(result).toMatchObject({
      id: "abc-123",
      email: "john.doe@example.com",
    });
  });

  it("should create and return new user if not found", async () => {
    const savedUser = {
      id: "xyz-789",
      ...profile,
      provider: "google",
      profile_completed: false,
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
