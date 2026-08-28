import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageRequestStatus } from "@src/entities/messageRequest.entity";
import { MetricsEntity } from "@src/entities/metrics.entity";
import { NotificationEntity } from "@src/entities/notification.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { TalentRecommendationService } from "@src/talents/services/talentRecommendation.service";
import { formatTalentResult } from "@src/talents/utils/talent.utils";
import { Brackets } from "typeorm";
import { getProfileStatus } from "../dashboard.utils";

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
  private readonly threadRepository = AppDataSource.getRepository(
    ConversationThreadEntity,
  );
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

    const data = {
      profile_status: profileStatus,
      total_upvotes: metrics?.upvotes || 0,
      profile_views: metrics?.profile_views || 0,
      search_appearances: metrics?.weekly_search_appearances || 0,
      recruiter_saves: metrics?.recruiter_saves || 0,
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

    const [savedTalentsRaw, recommendedProfiles] = await Promise.all([
      this.savedTalentRepository.find({
        where: { recruiter: { id: userId } },
        order: { saved_at: "DESC" },
        take: 4,
        relations: [
          "talent",
          "talent.talent_profile",
          "talent.talent_profile.skills",
          "talent.metrics",
        ],
      }),
      this.talentRecommendationService.recommendTalents(userId),
    ]);

    const formattedSavedTalents = savedTalentsRaw.map((talent) =>
      formatTalentResult(talent),
    );
    const formatRecommendedTalents = recommendedProfiles.map((profile) =>
      formatTalentResult(profile, {
        is_saved: formattedSavedTalents.some(
          (saved) => saved.id === profile.user.id,
        ),
      }),
    );

    const result = {
      welcome_message: generateRecruiterWelcomeMessage(
        recruiter.first_name || "there",
      ),
      saved_talents: formattedSavedTalents,
      recommended_talents: formatRecommendedTalents,
    };

    return result;
  }

  async getUserMetrics(userId: string) {
    const metrics = await this.metricsRepository.findOne({
      where: { user: { id: userId } },
    });

    return {
      upvotes: metrics?.upvotes || 0,
      profile_views: metrics?.profile_views || 0,
      recruiter_saves: metrics?.recruiter_saves || 0,
      weekly_search_appearances: metrics?.weekly_search_appearances || 0,
    };
  }

  async getUserNotifications(userId: string, limit = 20) {
    const notifications = await this.notificationRepository.find({
      where: { recipient: { id: userId } },
      order: { created_at: "DESC" },
      take: limit,
      relations: ["sender", "sender.recruiter_profile"],
    });

    return notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      message: notif.message,
      read: notif.read,
      timestamp: notif.created_at,
      sender: {
        id: notif.sender?.id || null,
        first_name: notif.sender?.first_name || null,
        last_name: notif.sender?.last_name || null,
        avatar: notif.sender?.avatar || null,
        role: notif.sender?.role || null,
      },
    }));
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipient: { id: userId },
      },
      relations: ["sender"],
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    notification.read = true;
    const savedNotification =
      await this.notificationRepository.save(notification);

    return {
      id: savedNotification.id,
      type: savedNotification.type,
      message: savedNotification.message,
      read: savedNotification.read,
      timestamp: savedNotification.created_at,
      sender: {
        id: savedNotification.sender?.id || null,
        first_name: savedNotification.sender?.first_name || null,
        last_name: savedNotification.sender?.last_name || null,
        avatar: savedNotification.sender?.avatar || null,
        role: savedNotification.sender?.role || null,
      },
    };
  }

  async getNotificationSummary(userId: string, role: UserRole) {
    const [unread_count, unread_message_count] = await Promise.all([
      this.notificationRepository.count({
        where: { recipient: { id: userId }, read: false },
      }),
      this.getUnreadMessageCount(userId, role),
    ]);

    return {
      unread_count,
      unread_message_count,
    };
  }

  private async getUnreadMessageCount(
    userId: string,
    role: UserRole,
  ): Promise<number> {
    const qb = this.threadRepository
      .createQueryBuilder("thread")
      .leftJoin("thread.accepted_request", "accepted_request")
      .where("accepted_request.status = :status", {
        status: MessageRequestStatus.ACCEPTED,
      })
      .andWhere("thread.latest_message_at IS NOT NULL");

    if (role === UserRole.RECRUITER) {
      qb.andWhere("thread.recruiter_id = :userId", { userId }).andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where("thread.recruiter_last_seen_at IS NULL")
            .orWhere(
              "thread.recruiter_last_seen_at < thread.latest_message_at",
            );
        }),
      );
    } else {
      qb.andWhere("thread.talent_id = :userId", { userId }).andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where("thread.talent_last_seen_at IS NULL")
            .orWhere("thread.talent_last_seen_at < thread.latest_message_at");
        }),
      );
    }

    return qb.getCount();
  }
}
