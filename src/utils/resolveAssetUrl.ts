const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

export const resolveAssetUrl = (path?: string): string | null => {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${BASE_URL}/${path}`;
};
