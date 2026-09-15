import config from "config";

const getBaseUrl = (): string => {
  const configuredBaseUrl = config.has("BASE_URL")
    ? config.get<string>("BASE_URL")
    : "";
  const baseUrl =
    configuredBaseUrl ||
    process.env.TALENTS_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:8000";

  return baseUrl.replace(/\/+$/, "");
};

export const resolveAssetUrl = (path?: string): string | null => {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${getBaseUrl()}/${path.replace(/^\/+/, "")}`;
};
