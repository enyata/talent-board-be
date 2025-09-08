import { LINKEDIN_CALLBACK_PATH } from "@src/auth/auth.constants";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import { createHttpsAgent } from "@src/utils/createHttpsAgent";
import log from "@src/utils/logger";
import axios from "axios";
import config from "config";
import { JwtHeader, SigningKeyCallback, verify } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";

const client = jwksClient({
  jwksUri: "https://www.linkedin.com/oauth/openid/jwks",
});

const getSigningKey = (header: JwtHeader, callback: SigningKeyCallback) => {
  client.getSigningKey(header.kid as string, (_err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

passport.use(
  "linkedin",
  new CustomStrategy(async (req, done) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return done(
          new UnauthorizedError("No code received from LinkedIn"),
          null,
        );
      }

      const clientId = config.get<string>("LINKEDIN_CLIENT_ID");
      const clientSecret = config.get<string>("LINKEDIN_CLIENT_SECRET");
      const redirectUri = `${config.get<string>("BASE_URL")}/${config.get<string>("API_PREFIX")}${LINKEDIN_CALLBACK_PATH}`;
      console.log({
        clientId,
        clientSecret,
        redirectUri,
        LINKEDIN_CALLBACK_PATH,
      });

      const publishedData = new URLSearchParams({
        grant_type: "authorization_code",
        code: code.trim(),
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });
      console.log({ publishedData, redirectUri });

      const tokenRes = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        publishedData,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          httpsAgent: createHttpsAgent(),
          timeout: 10000,
        },
      );

      const idToken = tokenRes.data.id_token;
      console.log({ idToken });

      if (!idToken) {
        return done(
          new UnauthorizedError("ID Token not provided by LinkedIn"),
          null,
        );
      }

      verify(
        idToken,
        getSigningKey,
        { algorithms: ["RS256"] },
        (err, decoded) => {
          if (err) {
            return done(new UnauthorizedError("Invalid ID token"), null);
          }

          const payload = decoded as any;

          const profileData = {
            first_name: payload.given_name || "LinkedIn",
            last_name: payload.family_name || "User",
            email: payload.email,
            avatar: payload.picture || null,
          };
          console.log(profileData, "==>verify>>");
          log.info("LinkedIn profile received");
          return done(null, profileData);
        },
      );
    } catch (error) {
      // @ts-ignore
      log.error("LinkedIn OAuth error", error);
      return done(error, null);
    }
  }),
);

export default passport;
