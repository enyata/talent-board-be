import config from "config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import log from "../utils/logger";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: `${config.get<string>("BASE_URL")}/${config.get<string>("API_PREFIX")}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const profileData = {
          first_name: profile.name?.givenName || "Google",
          last_name: profile.name?.familyName || "User",
          email: profile.emails?.[0]?.value || "",
          avatar: profile.photos?.[0]?.value || null,
        };

        log.info("Google profile received");
        return done(null, profileData);
      } catch (error) {
        log.error("Google OAuth error", error);
        return done(error, null);
      }
    },
  ),
);

export default passport;
