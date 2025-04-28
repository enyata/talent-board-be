import config from "config";
import { Agent } from "https";

export const createHttpsAgent = () => {
  const isProduction = config.get<string>("NODE_ENV") === "production";
  return new Agent({ rejectUnauthorized: isProduction });
};
