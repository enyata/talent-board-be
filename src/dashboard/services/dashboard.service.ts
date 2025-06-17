import AppDataSource from "@src/datasource";
import { MetricsEntity } from "@src/entities/metrics.entity";
import { NotificationEntity } from "@src/entities/notification.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { TalentRecommendationService } from "@src/talents/services/talentRecommendation.service";
import {
  getProfileStatus,
  serializeNotifications,
  serializeRecommendedTalents,
  serializeSavedTalents,
} from "../dashboard.utils";

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const recruiterMessages = [
  (name: string) =>
    `${getTimeBasedGreeting()} ${name}, ready to find your next great hire?`,
  (name: string) =>
    `${getTimeBasedGreeting()} ${name}, let’s discover top talent today.`,
  (name: string) => `Hey ${name}, your next hire might be just a click away.`,
  (name: string) => `Welcome back ${name}, explore new talent profiles now.`,
];

const generateRecruiterWelcomeMessage = (name: string) => {
  const index = Math.floor(Math.random() * recruiterMessages.length);
  return recruiterMessages[index](name);
};

export class DashboardService {
  private readonly userRepository = AppDataSource.getRepository(UserEntity);
  private readonly metricsRepository =
    AppDataSource.getRepository(MetricsEntity);
  private readonly notificationRepository =
    AppDataSource.getRepository(NotificationEntity);
  private readonly talentRepository =
    AppDataSource.getRepository(TalentProfileEntity);
  private readonly savedTalentRepository =
    AppDataSource.getRepository(SavedTalentEntity);
  private readonly talentRecommendationService =
    new TalentRecommendationService();

  async getTalentDashboard(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["talent_profile"],
    });

    if (!user || !user.talent_profile) {
      throw new NotFoundError("Talent Profile not found");
    }

    const profileStatus = getProfileStatus(user.talent_profile);

    const metrics = await this.metricsRepository.findOne({
      where: { user: { id: userId } },
    });

    const notifications = await this.notificationRepository.find({
      where: { recipient: { id: userId } },
      order: { created_at: "DESC" },
      take: 10,
      relations: ["sender"],
    });

    const data = {
      profile_status: profileStatus,
      total_upvotes: metrics?.upvotes || 0,
      profile_views: metrics?.profile_views || 0,
      search_appearances: metrics?.weekly_search_appearances || 0,
      recruiter_saves: metrics?.recruiter_saves || 0,
      notifications: notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        message: notif.message,
        read: notif.read,
        timestamp: notif.created_at,
        sender: {
          name: `${notif.sender.first_name} ${notif.sender.last_name}`,
          role: notif.sender.recruiter_profile?.company_industry ?? "",
          avatar: notif.sender.avatar,
          location: `${notif.sender.state ?? ""}, ${notif.sender.country ?? ""}`,
        },
      })),
    };
    return data;
  }

  async getRecruiterDashboard(userId: string) {
    const recruiter = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["recruiter_profile"],
    });

    if (!recruiter || !recruiter.recruiter_profile) {
      throw new NotFoundError("Recruiter Profile not found");
    }

    const [savedTalentsRaw, recommendedProfiles, notificationsRaw] =
      await Promise.all([
        this.savedTalentRepository.find({
          where: { recruiter: { id: userId } },
          order: { saved_at: "DESC" },
          take: 4,
          relations: ["talent", "talent.talent_profile", "talent.metrics"],
        }),
        this.talentRecommendationService.recommendTalents(userId),
        this.notificationRepository.find({
          where: { recipient: { id: userId } },
          order: { created_at: "DESC" },
          take: 10,
          relations: ["sender", "sender.recruiter_profile"],
        }),
      ]);

    const result = {
      welcome_message: generateRecruiterWelcomeMessage(recruiter.first_name),
      saved_talents: serializeSavedTalents(savedTalentsRaw),
      recommended_talents: serializeRecommendedTalents(recommendedProfiles),
      notifications: serializeNotifications(notificationsRaw),
    };

    return result;
  }
}
