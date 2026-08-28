describe("resolveAssetUrl", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("resolves upload paths against the configured base URL", () => {
    const mockConfig = {
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue("https://talents-api.enyata.com/"),
    };

    jest.doMock("config", () => mockConfig);

    const { resolveAssetUrl } = require("@src/utils/resolveAssetUrl");

    expect(resolveAssetUrl("/uploads/resumes/resume.pdf")).toBe(
      "https://talents-api.enyata.com/uploads/resumes/resume.pdf",
    );
  });

  it("leaves existing absolute URLs unchanged", () => {
    const mockConfig = {
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue("https://talents-api.enyata.com"),
    };

    jest.doMock("config", () => mockConfig);

    const { resolveAssetUrl } = require("@src/utils/resolveAssetUrl");

    expect(resolveAssetUrl("https://cdn.example.com/resume.pdf")).toBe(
      "https://cdn.example.com/resume.pdf",
    );
  });
});
