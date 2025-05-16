import { Request, Response } from "express";
import { mocked } from "jest-mock";
import {
  getRecruiterDashboard,
  getTalentDashboard,
} from "../../dashboard/dashboard.controller";
import { DashboardService } from "../../dashboard/services/dashboard.service";

jest.mock("@src/dashboard/services/dashboard.service");

const mockTalentDashboardData = {
  profile_status: "approved",
  total_upvotes: 5,
  profile_views: 15,
  recruiter_saves: 2,
  search_appearances: 3,
  notifications: [],
};

const mockRecruiterDashboardData = {
  welcome_message:
    "Good morning Recruiter, ready to find your next great hire?",
  saved_talents: [
    {
      id: "talent-123",
      first_name: "Jane",
      last_name: "Doe",
      avatar: "https://avatar.com/jane.jpg",
      skills: ["React", "Node.js"],
      portfolio_url: "https://portfolio.com/janedoe",
      experience_level: "expert",
    },
  ],
  recommended_talents: [],
  notifications: [],
};

describe("Dashboard controller", () => {
  const req = { user: { id: "test-user-id" } } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mocked(DashboardService.prototype.getTalentDashboard).mockResolvedValue(
      mockTalentDashboardData,
    );
    mocked(DashboardService.prototype.getRecruiterDashboard).mockResolvedValue(
      mockRecruiterDashboardData,
    );
  });

  it("should respond with status 200 and talent dashboard data", async () => {
    await getTalentDashboard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Dashboard fetched successfully",
      data: mockTalentDashboardData,
    });
  });

  it("should respond with status 200 and recruiter dashboard data", async () => {
    await getRecruiterDashboard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Dashboard fetched successfully",
      data: mockRecruiterDashboardData,
    });
  });
});
