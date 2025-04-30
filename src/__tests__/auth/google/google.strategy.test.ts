import passport from "passport";
import "../../../auth/google/google.strategy";
import { closeLogger } from "../../../utils/logger";

jest.mock("config", () => ({
  get: (key: string) => {
    const map: Record<string, string> = {
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-secret",
      BASE_URL: "http://localhost:8000",
      API_PREFIX: "api/v1",
    };
    return map[key];
  },
}));

describe("Google Strategy", () => {
  const strategy = (passport as any)._strategies.google;

  afterAll(async () => {
    await closeLogger();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should register the Google strategy under the 'google' key", () => {
    expect(strategy).toBeDefined();
    expect((strategy as any).name).toBe("google");
  });

  it("should extract full user profile correctly", async () => {
    const profileMock = {
      name: { givenName: "Jane", familyName: "Doe" },
      emails: [{ value: "jane.doe@example.com" }],
      photos: [{ value: "https://avatar.com/jane.png" }],
    };

    const done = jest.fn();

    await strategy._verify("access-token", "refresh-token", profileMock, done);

    expect(done).toHaveBeenCalledWith(null, {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      avatar: "https://avatar.com/jane.png",
    });
  });

  it("should apply default fallbacks if profile fields are missing", async () => {
    const profileMock = {
      name: {},
      emails: [],
      photos: [],
    };

    const done = jest.fn();

    await strategy._verify("access-token", "refresh-token", profileMock, done);

    expect(done).toHaveBeenCalledWith(null, {
      first_name: "Google",
      last_name: "User",
      email: "",
      avatar: null,
    });
  });

  it("should handle unexpected errors and call done with error", async () => {
    const badProfile = null as any;
    const done = jest.fn();

    await strategy._verify("access-token", "refresh-token", badProfile, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error), null);
  });
});
