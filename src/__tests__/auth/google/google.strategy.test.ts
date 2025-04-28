import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "../../../auth/google/google.strategy";
import { closeLogger } from "../../../utils/logger";

jest.spyOn(passport, "use");

describe("Google Strategy", () => {
  beforeAll(() => {
    passport.use(
      new GoogleStrategy(
        {
          clientID: "GOOGLE_CLIENT_ID",
          clientSecret: "GOOGLE_CLIENT_SECRET",
          callbackURL: "http://localhost:8000/api/v1/auth/google/callback",
        },
        (_accessToken, _refreshToken, profile, done) => {
          done(null, profile);
        },
      ),
    );
  });

  afterAll(async () => {
    await closeLogger();
  });

  it("should extract user profile correctly", async () => {
    const verifyCallback = jest.fn(
      (_accessToken, _refreshToken, profile, done) => {
        const profileData = {
          first_name: profile.name?.givenName || "Google",
          last_name: profile.name?.familyName || "User",
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value || null,
        };
        done(null, profileData);
      },
    );

    const profileMock = {
      name: { givenName: "John", familyName: "Doe" },
      emails: [{ value: "johndoe@gmail.com" }],
      photos: [{ value: "http://avatar.com/john.png" }],
    };

    verifyCallback(
      "mockAccessToken",
      "mockRefreshToken",
      profileMock,
      (err, profile) => {
        expect(err).toBeNull();
        expect(profile).toEqual({
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@gmail.com",
          avatar: "http://avatar.com/john.png",
        });
      },
    );
  });
});
