import config from "config";

// This function retrieves the base URL for the application. It first checks if a BASE_URL is configured in the application's configuration. If not, it checks for an environment variable named BASE_URL. If neither is set, it defaults to "http://localhost:8000". The function also ensures that the returned base URL does not have any trailing slashes.
const getBaseUrl = (): string => {
  const configuredBaseUrl = config.has("BASE_URL")
    ? config.get<string>("BASE_URL")
    : "";
  const baseUrl =
    configuredBaseUrl || process.env.BASE_URL || "http://localhost:8000";

  return baseUrl.replace(/\/+$/, "");
};

// This function resolves the full URL for an asset based on the provided path. If the path is a full URL (starting with "http://" or "https://"), it returns the path as is. If the path is relative, it prepends the base URL (retrieved from getBaseUrl) to the path, ensuring that there are no leading slashes in the final URL. If no path is provided, it returns null.
export const resolveAssetUrl = (path?: string): string | null => {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${getBaseUrl()}/${path.replace(/^\/+/, "")}`;
};
