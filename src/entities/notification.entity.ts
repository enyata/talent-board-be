import { Expose } from "class-transformer";
import { IsBoolean, IsEnum, IsString } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { UserEntity } from "./user.entity";

export enum NotificationType {
  SAVE = "save",
  VIEW = "view",
  UPVOTE = "upvote",
  MESSAGE = "message",
}

@Entity("notifications")
export class NotificationEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.received_notifications)
  @JoinColumn({ name: "recipient_id" })
  recipient: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "sender_id" })
  sender: UserEntity;

  @Column({ type: "enum", enum: NotificationType })
  @Expose()
  @IsEnum(NotificationType)
  type: NotificationType;

  @Column()
  @Expose()
  @IsString()
  message: string;

  @Column({ default: false })
  @Expose()
  @IsBoolean()
  read: boolean;
}
