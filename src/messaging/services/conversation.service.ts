import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageEntity } from "@src/entities/message.entity";
import { MessageRequestStatus } from "@src/entities/messageRequest.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import {
  ConversationInboxItemSummary,
  ConversationThreadSummary,
  MessageRequestUserSummary,
  MessageSummary,
  PaginatedConversationInboxSummary,
  PaginatedMessageSummary,
  SentConversationMessageSummary,
} from "@src/interfaces";
import {
  ListConversationMessagesDto,
  ListConversationThreadsDto,
  MarkConversationThreadSeenDto,
  SendConversationMessageDto,
} from "../schemas/conversation.schema";
import { MessagingEngagementService } from "./messagingEngagement.service";

export class ConversationService {
  private readonly threadRepo = AppDataSource.getRepository(
    ConversationThreadEntity,
  );
  private readonly messageRepo = AppDataSource.getRepository(MessageEntity);
  private readonly messagingEngagementService =
    new MessagingEngagementService();

  async getInbox(
    userId: string,
    role: UserRole,
    query: ListConversationThreadsDto,
  ): Promise<PaginatedConversationInboxSummary> {
    const page = query.page ?? 1;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [threads, total] = await this.threadRepo.findAndCount({
      where: {
        ...(role === UserRole.RECRUITER
          ? { recruiter: { id: userId } }
          : { talent: { id: userId } }),
        accepted_request: { status: MessageRequestStatus.ACCEPTED },
      },
      relations: ["recruiter", "talent", "accepted_request"],
      order: { latest_message_at: "DESC", updated_at: "DESC" },
      skip,
      take: limit,
    });

    const latestMessages = await Promise.all(
      threads.map((thread) => this.findLatestMessage(thread.id)),
    );

    return {
      threads: threads.map((thread, index) =>
        this.formatInboxItem(thread, userId, latestMessages[index]),
      ),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getMessages(
    userId: string,
    threadId: string,
    query: ListConversationMessagesDto,
  ): Promise<PaginatedMessageSummary> {
    const thread = await this.findAccessibleActiveThread(threadId, userId);
    const page = query.page ?? 1;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { thread: { id: thread.id } },
      relations: ["sender", "source_request"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      messages: messages
        .reverse()
        .map((message) => this.formatMessage(message)),
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async sendMessage(
    userId: string,
    threadId: string,
    payload: SendConversationMessageDto,
  ): Promise<SentConversationMessageSummary> {
    const result = await AppDataSource.manager.transaction(async (manager) => {
      const threadRepo = manager.getRepository(ConversationThreadEntity);
      const messageRepo = manager.getRepository(MessageEntity);

      const thread = await threadRepo.findOne({
        where: { id: threadId },
        relations: ["recruiter", "talent", "accepted_request"],
      });

      this.assertThreadIsAccessibleAndActive(thread, userId);

      const sender = this.resolveParticipant(thread, userId);
      const message = messageRepo.create({
        thread,
        sender,
        body: payload.body,
        source_request: null,
      });
      const savedMessage = await messageRepo.save(message);

      thread.latest_message_at = savedMessage.created_at || new Date();
      if (thread.recruiter.id === userId) {
        thread.recruiter_last_seen_at = thread.latest_message_at;
      } else {
        thread.talent_last_seen_at = thread.latest_message_at;
      }
      const savedThread = await threadRepo.save(thread);

      return {
        savedThread,
        sender,
        body: savedMessage.body,
        thread: this.formatConversationThread(savedThread, userId),
        message: this.formatMessage(savedMessage),
      };
    });

    void this.messagingEngagementService.onMessageSent({
      thread: result.savedThread,
      sender: result.sender,
      body: result.body,
    });

    return {
      thread: result.thread,
      message: result.message,
    };
  }

  async markThreadAsSeen(
    userId: string,
    threadId: string,
    payload: MarkConversationThreadSeenDto,
  ): Promise<ConversationThreadSummary> {
    return AppDataSource.manager.transaction(async (manager) => {
      const threadRepo = manager.getRepository(ConversationThreadEntity);
      const thread = await threadRepo.findOne({
        where: { id: threadId },
        relations: ["recruiter", "talent", "accepted_request"],
      });

      this.assertThreadIsAccessibleAndActive(thread, userId);

      const seenAt = payload.seen_at ?? new Date();
      if (thread.recruiter.id === userId) {
        thread.recruiter_last_seen_at = this.getLaterDate(
          thread.recruiter_last_seen_at,
          seenAt,
        );
      } else {
        thread.talent_last_seen_at = this.getLaterDate(
          thread.talent_last_seen_at,
          seenAt,
        );
      }

      const savedThread = await threadRepo.save(thread);
      return this.formatConversationThread(savedThread, userId);
    });
  }

  private async findAccessibleActiveThread(
    threadId: string,
    userId: string,
  ): Promise<ConversationThreadEntity> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      relations: ["recruiter", "talent", "accepted_request"],
    });

    this.assertThreadIsAccessibleAndActive(thread, userId);
    return thread;
  }

  private assertThreadIsAccessibleAndActive(
    thread: ConversationThreadEntity | null,
    userId: string,
  ): asserts thread is ConversationThreadEntity {
    if (!thread || !this.isParticipant(thread, userId)) {
      throw new NotFoundError("Conversation thread not found");
    }

    if (thread.accepted_request?.status !== MessageRequestStatus.ACCEPTED) {
      throw new ConflictError("Conversation is not active");
    }
  }

  private async findLatestMessage(
    threadId: string,
  ): Promise<MessageEntity | null> {
    return this.messageRepo.findOne({
      where: { thread: { id: threadId } },
      relations: ["sender", "source_request"],
      order: { created_at: "DESC" },
    });
  }

  private formatInboxItem(
    thread: ConversationThreadEntity,
    userId: string,
    latestMessage: MessageEntity | null,
  ): ConversationInboxItemSummary {
    return {
      ...this.formatConversationThread(thread, userId),
      conversation_partner: this.formatUser(
        thread.recruiter.id === userId ? thread.talent : thread.recruiter,
      ),
      latest_message: latestMessage ? this.formatMessage(latestMessage) : null,
    };
  }

  private formatConversationThread(
    thread: ConversationThreadEntity,
    viewerUserId?: string,
  ): ConversationThreadSummary {
    const latestMessageSeenAt = this.resolveLatestMessageSeenAt(
      thread,
      viewerUserId,
    );

    return {
      id: thread.id,
      recruiter_last_seen_at: thread.recruiter_last_seen_at,
      talent_last_seen_at: thread.talent_last_seen_at,
      latest_message_at: thread.latest_message_at,
      latest_message_seen_at: latestMessageSeenAt,
      latest_message_seen_status: this.resolveLatestMessageSeenStatus(
        thread.latest_message_at,
        latestMessageSeenAt,
      ),
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      accepted_request_id: thread.accepted_request?.id || null,
      recruiter: this.formatUser(thread.recruiter),
      talent: this.formatUser(thread.talent),
    };
  }

  private formatMessage(message: MessageEntity): MessageSummary {
    return {
      id: message.id,
      body: message.body,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender: this.formatUser(message.sender),
      source_request_id: message.source_request?.id || null,
    };
  }

  private formatUser(user: UserEntity): MessageRequestUserSummary {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      role: user.role,
    };
  }

  private resolveParticipant(
    thread: ConversationThreadEntity,
    userId: string,
  ): UserEntity {
    return thread.recruiter.id === userId ? thread.recruiter : thread.talent;
  }

  private isParticipant(
    thread: ConversationThreadEntity,
    userId: string,
  ): boolean {
    return thread.recruiter.id === userId || thread.talent.id === userId;
  }

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }

  private resolveLatestMessageSeenAt(
    thread: ConversationThreadEntity,
    viewerUserId?: string,
  ): Date | null {
    if (!viewerUserId) {
      return null;
    }

    if (thread.recruiter.id === viewerUserId) {
      return thread.recruiter_last_seen_at;
    }

    if (thread.talent.id === viewerUserId) {
      return thread.talent_last_seen_at;
    }

    return null;
  }

  private resolveLatestMessageSeenStatus(
    latestMessageAt: Date | null,
    latestMessageSeenAt: Date | null,
  ): "seen" | "unseen" | "no_messages" {
    if (!latestMessageAt) {
      return "no_messages";
    }

    if (!latestMessageSeenAt) {
      return "unseen";
    }

    return latestMessageSeenAt.getTime() >= latestMessageAt.getTime()
      ? "seen"
      : "unseen";
  }

  private getLaterDate(currentDate: Date | null, candidateDate: Date): Date {
    if (!currentDate) {
      return candidateDate;
    }

    return currentDate.getTime() > candidateDate.getTime()
      ? currentDate
      : candidateDate;
  }
}
