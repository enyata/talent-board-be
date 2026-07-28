import { Expose } from "class-transformer";
import { IsString } from "class-validator";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import ExtendedBaseEntity from "./base.entity";
import { ConversationThreadEntity } from "./conversationThread.entity";
import { MessageRequestEntity } from "./messageRequest.entity";
import { UserEntity } from "./user.entity";

@Entity("messages")
@Index("IDX_messages_thread_created_at", ["thread", "created_at"])
@Index("IDX_messages_sender", ["sender"])
export class MessageEntity extends ExtendedBaseEntity {
  @ManyToOne(() => ConversationThreadEntity, (thread) => thread.messages, {
    eager: false,
  })
  @JoinColumn({ name: "thread_id" })
  thread: ConversationThreadEntity;

  @ManyToOne(() => UserEntity, (user) => user.sent_messages, { eager: false })
  @JoinColumn({ name: "sender_id" })
  sender: UserEntity;

  @ManyToOne(() => MessageRequestEntity, { eager: false, nullable: true })
  @JoinColumn({ name: "source_request_id" })
  source_request: MessageRequestEntity | null;

  @Column({ type: "text" })
  @Expose()
  @IsString()
  body: string;
}
