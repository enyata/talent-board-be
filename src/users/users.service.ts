import AppDataSource from "@src/datasource";
import { UserEntity } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { sanitizeUser } from "@src/utils/sanitizeUser";

export class UserService {
  private userRepo = AppDataSource.getRepository(UserEntity);

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");
    return sanitizeUser(user);
  }
}
