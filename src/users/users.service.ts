import { DashboardService } from "@src/dashboard/services/dashboard.service";
import AppDataSource from "@src/datasource";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { sanitizeUser } from "@src/utils/sanitizeUser";

export class UserService {
  private userRepo = AppDataSource.getRepository(UserEntity);
  private dashboardService = new DashboardService();

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["talent_profile", "recruiter_profile"],
    });
    if (!user) throw new NotFoundError("User not found");

    const sanitized = sanitizeUser(user);

    let dashboardData = null;
    if (user.role === UserRole.TALENT) {
      dashboardData = await this.dashboardService.getTalentDashboard(userId);
    }

    return {
      ...sanitized,
      dashboard: dashboardData,
    };
  }
}
