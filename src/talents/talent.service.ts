import { MetricsService } from "@src/dashboard/services/metrics.service";
import { NotificationService } from "@src/dashboard/services/notification.service";
import AppDataSource from "@src/datasource";
import { NotificationType } from "@src/entities/notification.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { UserEntity } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { CacheService } from "@src/utils/cache.service";

export class TalentService {
  private readonly userRepo = AppDataSource.getRepository(UserEntity);
  private readonly saveRepo = AppDataSource.getRepository(SavedTalentEntity);
  private readonly notificationService = new NotificationService();
  private readonly metricsService = new MetricsService();

  async saveTalent(talentId: string, recruiterId: string) {
    if (recruiterId === talentId) {
      throw new ClientError("You cannot save yourself");
    }

    const [recruiter, talent] = await Promise.all([
      this.userRepo.findOne({ where: { id: recruiterId } }),
      this.userRepo.findOne({
        where: { id: talentId },
        relations: ["talent_profile"],
      }),
    ]);

    if (!recruiter || recruiter.role !== "recruiter") {
      throw new NotFoundError("Recruiter not found or unauthorized");
    }
    if (!talent || !talent.talent_profile) {
      throw new NotFoundError("Talent not found");
    }

    const exists = await this.saveRepo.findOne({
      where: {
        recruiter: { id: recruiterId },
        talent: { id: talentId },
      },
    });
    if (exists) return;

    const savedTalent = this.saveRepo.create({
      recruiter,
      talent,
      saved_at: new Date(),
    });
    await this.saveRepo.save(savedTalent);

    await this.notificationService.sendNotification(
      NotificationType.SAVE,
      recruiterId,
      talentId,
    );

    await this.metricsService.incrementMetric(talentId, "recruiter_saves");

    await CacheService.del(`dashboard_talent_${recruiterId}`);
  }
}
