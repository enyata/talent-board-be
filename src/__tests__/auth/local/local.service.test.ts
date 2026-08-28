import { hash } from "argon2";
import { EntityManager } from "typeorm";
import { LocalAuthService } from "../../../auth/local/local.service";
import { ConflictError } from "../../../exceptions/conflictError";

jest.mock("argon2", () => ({
  hash: jest.fn(),
}));

const mockManager = {
  transaction: jest.fn(),
};

describe("LocalAuthService", () => {
  const service = new LocalAuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ConflictError when the user already exists", async () => {
    const existingUser = { id: "user-123", email: "john.doe@example.com" };

    mockManager.transaction.mockImplementation(async (callback) =>
      callback({ findOne: jest.fn().mockResolvedValue(existingUser) }),
    );

    await expect(
      service.signup(
        { email: "john.doe@example.com", password: "Password1!" },
        mockManager as unknown as EntityManager,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("should create and return a new local user", async () => {
    const userPayload = {
      email: "john.doe@example.com",
      password: "Password1!",
    };
    const savedUser = {
      id: "user-456",
      email: userPayload.email,
      is_email_verified: false,
      profile_completed: false,
    };

    (hash as jest.Mock).mockResolvedValue("hashed-password");

    mockManager.transaction.mockImplementation(async (callback) =>
      callback({
        findOne: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockReturnValue(savedUser),
        save: jest.fn().mockResolvedValue(savedUser),
      }),
    );

    const result = await service.signup(
      userPayload,
      mockManager as unknown as EntityManager,
    );

    expect(result).toMatchObject({
      id: "user-456",
      email: "john.doe@example.com",
    });
    expect(hash).toHaveBeenCalledWith(userPayload.password);
    expect(mockManager.transaction).toHaveBeenCalled();
  });
});
