import { Request, Response } from "express";
import { mocked } from "jest-mock";
import {
  getRecruiterDashboard,
  getTalentDashboard,
  getUserNotifications,
} from "../../dashboard/dashboard.controller";
import { DashboardService } from "../../dashboard/services/dashboard.service";
import { ExperienceLevel } from "../../entities/talentProfile.entity";
import { UserRole } from "../../entities/user.entity";

jest.mock("@src/dashboard/services/dashboard.service");

const mockTalentDashboardData = {
  profile_status: "approved",
  total_upvotes: 5,
  profile_views: 15,
  recruiter_saves: 2,
  search_appearances: 3,
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
      experience_level: ExperienceLevel.EXPERT,
      saved_at: new Date("2023-01-01T00:00:00.000Z"),
      state: "Lagos",
      country: "Nigeria",
      linkedin_profile: "https://linkedin.com/in/janedoe",
    },
  ],
  recommended_talents: [],
};

describe("Dashboard controller", () => {
  const req = {
    user: { id: "test-user-id", role: UserRole.TALENT },
  } as unknown as Request;
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
    mocked(DashboardService.prototype.getUserNotifications).mockResolvedValue([
      {
        id: "notif-1",
        type: "message",
        message: "You have a new message",
        read: false,
        timestamp: new Date("2023-01-01T00:00:00.000Z"),
        sender: {
          id: "sender-1",
          first_name: "Jane",
          last_name: "Doe",
          avatar: null,
          role: "recruiter",
        },
      },
    ]);
    mocked(DashboardService.prototype.getNotificationSummary).mockResolvedValue(
      {
        unread_count: 3,
        unread_message_count: 1,
      },
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

  it("should respond with status 200 and notifications plus summary", async () => {
    const notificationsReq = {
      ...req,
      query: { limit: "20" },
    } as unknown as Request;

    await getUserNotifications(notificationsReq, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Notifications fetched successfully",
      data: [
        {
          id: "notif-1",
          type: "message",
          message: "You have a new message",
          read: false,
          timestamp: new Date("2023-01-01T00:00:00.000Z"),
          sender: {
            id: "sender-1",
            first_name: "Jane",
            last_name: "Doe",
            avatar: null,
            role: "recruiter",
          },
        },
      ],
      summary: {
        unread_count: 3,
        unread_message_count: 1,
      },
    });
  });
});
