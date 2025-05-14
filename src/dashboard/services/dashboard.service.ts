import AppDataSource from "@src/datasource";
import { MetricsEntity } from "@src/entities/metrics.entity";
import { NotificationEntity } from "@src/entities/notification.entity";
import { UserEntity } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { CacheService } from "@src/utils/cache.service";
import { getProfileStatus } from "../dashboard.utils";

export class DashboardService {
  private readonly userRepository = AppDataSource.getRepository(UserEntity);
  private readonly metricsRepository =
    AppDataSource.getRepository(MetricsEntity);
  private readonly notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  async getTalentDashboard(userId: string) {
    const cacheKey = `dashboard_talent_${userId}`;
    const cachedData = await CacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

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

    CacheService.set(cacheKey, data, 60 * 60);
    return data;
  }
}
