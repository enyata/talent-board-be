jest.mock("@src/utils/redis", () => ({
  __esModule: true,
  default: {
    set: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn(),
    quit: jest.fn(),
  },
}));
