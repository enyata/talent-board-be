import { Expose } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { ConversationThreadEntity } from "./conversationThread.entity";
import { UserEntity } from "./user.entity";

export enum MessageRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity("message_requests")
@Index("IDX_message_requests_recruiter_talent_status", [
  "recruiter",
  "talent",
  "status",
])
@Index(
  "UQ_message_requests_pending_recruiter_talent",
  ["recruiter", "talent"],
  {
    unique: true,
    where: '"status" = \'pending\' AND "deleted_at" IS NULL',
  },
)
export class MessageRequestEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.sent_message_requests, {
    eager: false,
  })
  @JoinColumn({ name: "recruiter_id" })
  recruiter: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.received_message_requests, {
    eager: false,
  })
  @JoinColumn({ name: "talent_id" })
  talent: UserEntity;

  @Column({ type: "text", nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  intro_note: string | null;

  @Column({
    type: "enum",
    enum: MessageRequestStatus,
    default: MessageRequestStatus.PENDING,
  })
  @Expose()
  @IsEnum(MessageRequestStatus)
  status: MessageRequestStatus;

  @Column({ type: "timestamp", nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  responded_at: Date | null;

  @OneToOne(() => ConversationThreadEntity, (thread) => thread.accepted_request)
  conversation_thread: ConversationThreadEntity | null;
}
