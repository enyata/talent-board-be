import { Expose } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { MessageRequestEntity } from "./messageRequest.entity";
import { MessageEntity } from "./message.entity";
import { UserEntity } from "./user.entity";

@Entity("conversation_threads")
@Unique("UQ_conversation_threads_recruiter_talent", ["recruiter", "talent"])
@Index("IDX_conversation_threads_recruiter_latest", [
  "recruiter",
  "latest_message_at",
])
@Index("IDX_conversation_threads_talent_latest", [
  "talent",
  "latest_message_at",
])
export class ConversationThreadEntity extends ExtendedBaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.recruiter_conversation_threads, {
    eager: false,
  })
  @JoinColumn({ name: "recruiter_id" })
  recruiter: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.talent_conversation_threads, {
    eager: false,
  })
  @JoinColumn({ name: "talent_id" })
  talent: UserEntity;

  @OneToOne(
    () => MessageRequestEntity,
    (request) => request.conversation_thread,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: "accepted_request_id" })
  accepted_request: MessageRequestEntity | null;

  @OneToMany(() => MessageEntity, (message) => message.thread)
  messages: MessageEntity[];

  @Column({ type: "timestamp", nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  recruiter_last_seen_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  talent_last_seen_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  @Expose()
  @IsOptional()
  @IsDate()
  latest_message_at: Date | null;
}
