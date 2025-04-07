import config from "config";
import swaggerJsdoc, { SwaggerDefinition } from "swagger-jsdoc";
import { version } from "../package.json";

const PORT = config.get<number>("PORT") || 3000;
const NODE_ENV = config.get<string>("NODE_ENV") || "development";
const BASE_URL = config.get<string>("BASE_URL") || `http://localhost:${PORT}`;

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
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      OAuth2: {
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
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Something went wrong!" },
          statusCode: { type: "number", example: 500 },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }, { OAuth2: [] }],
  externalDocs: {
    url: config.get<string>("SWAGGER_JSON_URL") || "",
  },
};

const options = {
  swaggerDefinition,
  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
    "./src/services/*.ts",
    "./src/schema/*.ts",
    "./src/docs/*.ts",
  ],
  oauth2RedirectUrl: `http://localhost:${PORT}/api-docs/oauth2-redirect.html`,
};

const specs = swaggerJsdoc(options);

export default specs;
