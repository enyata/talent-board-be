import config from "config";
import swaggerJsdoc, { SwaggerDefinition } from "swagger-jsdoc";
import { version } from "../package.json";

const PORT = config.get<number>("PORT") || 8000;
const NODE_ENV = config.get<string>("NODE_ENV") || "development";
const BASE_URL = config.get<string>("BASE_URL") || `http://localhost:${PORT}`;
const isCompiled = config.get<string>("NODE_ENV") === "production";

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.1.0",
  info: {
    title: "Talent Board API with Swagger",
    version,
    description: "API documentation for the Talent Board web app",
  },
  servers: [
    {
      url: `http://localhost:${PORT}/`,
      description: "Local server",
    },
    ...(NODE_ENV === "production"
      ? [
          {
            url: BASE_URL,
            description: "Production server",
          },
        ]
      : []),
  ],
  tags: [
    {
      name: "System",
      description: "System monitoring endpoints",
    },
    {
      name: "default",
      description: "General routes",
    },
    {
      name: "Authentication",
      description: "Authentication routes",
    },
    {
      name: "Onboarding",
      description: "Onboarding routes",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      OAuth2_Google: {
        type: "oauth2",
        description: "Google OAuth2 authentication",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            scopes: {
              email: "Access email address",
              profile: "Access user profile",
            },
          },
        },
      },
      OAuth2_LinkedIn: {
        type: "oauth2",
        description: "LinkedIn OAuth2 authentication",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
            tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
            scopes: {
              email: "Access email address",
              profile: "Access basic profile info",
              openid: "OpenID Connect",
            },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Something went wrong!" },
          status_code: { type: "number", example: 500 },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "a1b2c3d4-uuid" },
          first_name: { type: "string", example: "Jane" },
          last_name: { type: "string", example: "Doe" },
          email: { type: "string", example: "jane.doe@example.com" },
          avatar: {
            type: "string",
            nullable: true,
            example: "https://avatar.com/jane.png",
          },
          role: {
            type: "string",
            nullable: true,
            example: "talent",
          },
          provider: {
            type: "string",
            enum: ["google", "linkedin"],
            example: "google",
          },
        },
      },
      AccessToken: {
        type: "string",
        description: "JWT access token",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      RefreshToken: {
        type: "string",
        description: "JWT refresh token",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      TalentProfilePreview: {
        type: "object",
        properties: {
          id: { type: "string", example: "a1b2c3d4-uuid" },
          first_name: { type: "string", example: "Jane" },
          last_name: { type: "string", example: "Doe" },
          avatar: {
            type: "string",
            nullable: true,
            example: "https://example.com/avatar.png",
          },
          state: { type: "string", example: "Lagos" },
          country: { type: "string", example: "Nigeria" },
          linkedin_profile: {
            type: "string",
            nullable: true,
            example: "https://linkedin.com/in/janedoe",
          },
          skills: {
            type: "array",
            items: { type: "string" },
            example: ["Node.js", "React", "TypeScript"],
          },
          experience_level: {
            type: "string",
            enum: ["entry", "intermediate", "expert"],
            example: "intermediate",
          },
          portfolio_url: {
            type: "string",
            nullable: true,
            example: "https://janedoe.dev",
          },
          job_title: {
            type: "string",
            example: "Software developer",
          },
          bio: {
            type: "string",
            example: "I am passionate developer",
          },
        },
      },
      TalentProfileDetailed: {
        type: "object",
        properties: {
          id: { type: "string", example: "a1b2c3d4-uuid" },
          first_name: { type: "string", example: "Jane" },
          last_name: { type: "string", example: "Doe" },
          avatar: { type: "string", nullable: true },
          state: { type: "string", example: "Lagos" },
          country: { type: "string", example: "Nigeria" },
          job_title: { type: "string", example: "Software developer" },
          bio: { type: "string", example: "I am passionate developer" },
          linkedin_profile: { type: "string", nullable: true },
          portfolio_url: { type: "string", nullable: true },
          resume_path: { type: "string", example: "uploads/jane_resume.pdf" },
          skills: {
            type: "array",
            items: { type: "string" },
            example: ["React", "Node.js", "TypeScript"],
          },
          experience_level: {
            type: "string",
            enum: ["entry", "intermediate", "expert"],
            example: "intermediate",
          },
          created_at: { type: "string", format: "date-time" },
          metrics: {
            type: "object",
            properties: {
              upvotes: { type: "integer", example: 5 },
              recruiter_saves: { type: "integer", example: 2 },
            },
          },
          is_saved: { type: "boolean", example: "true" },
          is_upvoted: { type: "boolean", example: "false" },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { OAuth2_Google: [] },
    { OAuth2_LinkedIn: [] },
  ],
  externalDocs: {
    url: config.get<string>("SWAGGER_JSON_URL") || "",
  },
};

const options = {
  swaggerDefinition,
  apis: isCompiled
    ? ["./build/src/routes/**/*.js", "./build/src/docs/**/*.js"]
    : ["./src/routes/**/*.ts", "./src/docs/**/*.ts"],
  oauth2RedirectUrl: `${BASE_URL}/docs/oauth2-redirect.html`,
};

const specs = swaggerJsdoc(options);

export default specs;
