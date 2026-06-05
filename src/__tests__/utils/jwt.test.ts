import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "../../utils/jwt";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe("JWT Utility Functions", () => {
  const mockId = "user-id-123";
  const mockKeyName = "ACCESS_TOKEN_PRIVATE_KEY";
  const mockPublicKeyName = "ACCESS_TOKEN_PUBLIC_KEY";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signToken", () => {
    it("should generate a token successfully", () => {
      (jwt.sign as jest.Mock).mockReturnValue("mocked-jwt-token");

      const token = signToken(mockId, mockKeyName);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockId },
        expect.any(String),
        { algorithm: "RS256" },
      );
      expect(token).toBe("mocked-jwt-token");
    });

    it("should throw if signing fails", () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error("Signing error");
      });

      expect(() => signToken(mockId, mockKeyName)).toThrow("Signing error");
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const mockPayload = { id: mockId };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = verifyToken("valid-jwt-token", mockPublicKeyName);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-jwt-token",
        expect.any(String),
      );
      expect(result).toEqual(mockPayload);
    });

    it("should return null for invalid token", () => {
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = verifyToken("invalid", mockPublicKeyName);
      expect(result).toBeNull();
    });
  });
});
