import { EntityManager } from "typeorm";
import { GoogleProfile } from "../interfaces";
import { GoogleAuthService } from "../services/googleAuth.service";

jest.mock("../entities/user.entity", () => ({
  UserEntity: jest.fn().mockImplementation(() => ({})),
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
    const existingUser = { id: "abc-123", email: profile.email };
    mockManager.transaction.mockImplementation(async (cb) =>
      cb({
        findOne: jest.fn().mockResolvedValue(existingUser),
      }),
    );

    const user = await service.authenticateOrCreateUser(
      profile,
      mockManager as unknown as EntityManager,
    );
    expect(user).toBe(existingUser);
  });

  it("should create and return new user if not found", async () => {
    const savedUser = { id: "xyz-789", ...profile };
    mockManager.transaction.mockImplementation(async (cb) =>
      cb({
        findOne: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockReturnValue(savedUser),
        save: jest.fn().mockResolvedValue(savedUser),
      }),
    );

    const user = await service.authenticateOrCreateUser(
      profile,
      mockManager as unknown as EntityManager,
    );
    expect(user).toEqual(savedUser);
  });
});
