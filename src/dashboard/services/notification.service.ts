import AppDataSource from "@src/datasource";
import {
  NotificationEntity,
  NotificationType,
} from "@src/entities/notification.entity";
import { UserEntity } from "@src/entities/user.entity";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { generateNotificationMessage } from "../dashboard.utils";

export class NotificationService {
  private readonly notificationRepository =
    AppDataSource.getRepository(NotificationEntity);
  private readonly userRepository = AppDataSource.getRepository(UserEntity);

  async sendNotification(
    type: NotificationType,
    senderId: string,
    recipientId: string,
  ): Promise<NotificationEntity> {
    const sender = await this.userRepository.findOneBy({ id: senderId });
    const recipient = await this.userRepository.findOneBy({ id: recipientId });

    if (!sender || !recipient) {
      throw new NotFoundError("Sender or recipient not found");
    }

    const message = generateNotificationMessage(
      type,
      `${sender.first_name} ${sender.last_name}`,
    );

    const notification = this.notificationRepository.create({
      type,
      sender,
      recipient,
      message,
      read: false,
    });

    return this.notificationRepository.save(notification);
  }
}
