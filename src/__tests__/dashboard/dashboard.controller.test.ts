import { Request, Response } from "express";
import { mocked } from "jest-mock";
import { getTalentDashboard } from "../../dashboard/dashboard.controller";
import { DashboardService } from "../../dashboard/services/dashboard.service";

jest.mock("@src/dashboard/services/dashboard.service");

const mockDashboardData = {
  profile_status: "approved",
  total_upvotes: 5,
  profile_views: 15,
  recruiter_saves: 2,
  search_appearances: 3,
  notifications: [],
};

describe("getTalentDashboard controller", () => {
  const req = { user: { id: "test-user-id" } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mocked(DashboardService.prototype.getTalentDashboard).mockResolvedValue(
      mockDashboardData,
    );
  });

  it("should respond with status 200 and dashboard data", async () => {
    await getTalentDashboard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Dashboard fetched successfully",
      data: mockDashboardData,
    });
  });
});
