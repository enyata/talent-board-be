export const encodeCursor = (cursor: Record<string, any>): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeCursor = (encoded: string): Record<string, any> | null => {
  try {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return null;
  }
};
