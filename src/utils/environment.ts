import config from "config";

export const getNodeEnv = (): string => {
  const configuredEnv = config.has("NODE_ENV")
    ? config.get<string>("NODE_ENV")
    : "";

  return (
    configuredEnv ||
    process.env.TALENTS_NODE_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
};

export const isDevelopmentEnv = (): boolean => getNodeEnv() === "development";
