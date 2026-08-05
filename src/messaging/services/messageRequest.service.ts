import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageEntity } from "@src/entities/message.entity";
import {
  MessageRequestEntity,
  MessageRequestStatus,
} from "@src/entities/messageRequest.entity";
import {
  ProfileStatus,
  TalentProfileEntity,
} from "@src/entities/talentProfile.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import {
  AcceptedMessageRequestSummary,
  ConversationThreadSummary,
  MessageRequestSummary,
  MessageRequestUserSummary,
  MessageSummary,
  PaginatedMessageRequestSummary,
} from "@src/interfaces";
import config from "config";
import { Repository } from "typeorm";
import {
  CreateMessageRequestDto,
  ListMessageRequestsDto,
} from "../schemas/messageRequest.schema";

export class MessageRequestService {
  private readonly userRepo = AppDataSource.getRepository(UserEntity);
  private readonly requestRepo =
    AppDataSource.getRepository(MessageRequestEntity);
  private readonly threadRepo = AppDataSource.getRepository(
    ConversationThreadEntity,
  );

  async createMessageRequest(
    recruiterId: string,
    payload: CreateMessageRequestDto,
  ): Promise<MessageRequestSummary> {
    const talentId = payload.talent_id;

    if (recruiterId === talentId) {
      throw new ClientError("You cannot send a message request to yourself");
    }

    const [recruiter, talent] = await Promise.all([
      this.userRepo.findOne({
        where: { id: recruiterId, role: UserRole.RECRUITER },
      }),
      this.userRepo.findOne({
        where: {
          id: talentId,
          role: UserRole.TALENT,
          profile_completed: true,
        },
        relations: ["talent_profile"],
      }),
    ]);

    if (!recruiter) {
      throw new NotFoundError("Recruiter not found or unauthorized");
    }

    if (!this.isApprovedTalent(talent)) {
      throw new NotFoundError("Talent not found");
    }

    await this.assertRequestCanBeCreated(recruiterId, talentId);

    const messageRequest = this.requestRepo.create({
      recruiter,
      talent,
      intro_note: this.normalizeIntroNote(payload.intro_note),
      status: MessageRequestStatus.PENDING,
    });

    try {
      const savedRequest = await this.requestRepo.save(messageRequest);
      return this.formatMessageRequest(savedRequest);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new ConflictError(
          "A message request to this talent is already pending",
        );
      }
      throw error;
    }
  }

  async acceptMessageRequest(
    talentId: string,
    requestId: string,
  ): Promise<AcceptedMessageRequestSummary> {
    return AppDataSource.manager.transaction(async (manager) => {
      const requestRepo = manager.getRepository(MessageRequestEntity);
      const threadRepo = manager.getRepository(ConversationThreadEntity);
      const messageRepo = manager.getRepository(MessageEntity);

      const request = await requestRepo.findOne({
        where: { id: requestId },
        relations: ["recruiter", "talent"],
      });

      this.assertTalentCanRespondToRequest(request, talentId);

      request.status = MessageRequestStatus.ACCEPTED;
      request.responded_at = new Date();

      const savedRequest = await requestRepo.save(request);

      let thread = await threadRepo.findOne({
        where: {
          recruiter: { id: savedRequest.recruiter.id },
          talent: { id: savedRequest.talent.id },
        },
        relations: ["recruiter", "talent", "accepted_request"],
      });

      if (!thread) {
        thread = threadRepo.create({
          recruiter: savedRequest.recruiter,
          talent: savedRequest.talent,
          accepted_request: savedRequest,
          recruiter_last_seen_at: null,
          talent_last_seen_at: null,
          latest_message_at: null,
        });
      } else {
        thread.accepted_request = savedRequest;
      }

      thread = await threadRepo.save(thread);

      const initialMessage = await this.createInitialMessageFromRequest(
        messageRepo,
        savedRequest,
        thread,
      );

      if (initialMessage) {
        thread.latest_message_at =
          initialMessage.created_at || savedRequest.created_at;
        thread = await threadRepo.save(thread);
      }

      return {
        request: this.formatMessageRequest(savedRequest),
        thread: this.formatConversationThread(thread, talentId),
        initial_message: initialMessage
          ? this.formatMessage(initialMessage)
          : null,
      };
    });
  }

  async declineMessageRequest(
    talentId: string,
    requestId: string,
  ): Promise<MessageRequestSummary> {
    return AppDataSource.manager.transaction(async (manager) => {
      const requestRepo = manager.getRepository(MessageRequestEntity);

      const request = await requestRepo.findOne({
        where: { id: requestId },
        relations: ["recruiter", "talent"],
      });

      this.assertTalentCanRespondToRequest(request, talentId);

      request.status = MessageRequestStatus.DECLINED;
      request.responded_at = new Date();

      const savedRequest = await requestRepo.save(request);
      return this.formatMessageRequest(savedRequest);
    });
  }

  async getIncomingRequests(
    talentId: string,
    query: ListMessageRequestsDto,
  ): Promise<PaginatedMessageRequestSummary> {
    const page = query.page ?? 1;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [requests, total] = await this.requestRepo.findAndCount({
      where: {
        talent: { id: talentId },
        ...(query.status ? { status: query.status } : {}),
      },
      relations: ["recruiter", "talent"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      requests: requests.map((request) => this.formatMessageRequest(request)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getOutgoingRequests(
    recruiterId: string,
    query: ListMessageRequestsDto,
  ): Promise<PaginatedMessageRequestSummary> {
    const page = query.page ?? 1;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [requests, total] = await this.requestRepo.findAndCount({
      where: {
        recruiter: { id: recruiterId },
        ...(query.status ? { status: query.status } : {}),
      },
      relations: ["recruiter", "talent"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      requests: requests.map((request) => this.formatMessageRequest(request)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  private async assertRequestCanBeCreated(
    recruiterId: string,
    talentId: string,
  ): Promise<void> {
    const [pendingRequest, acceptedRequest, existingThread, declinedRequest] =
      await Promise.all([
        this.requestRepo.findOne({
          where: {
            recruiter: { id: recruiterId },
            talent: { id: talentId },
            status: MessageRequestStatus.PENDING,
          },
        }),
        this.requestRepo.findOne({
          where: {
            recruiter: { id: recruiterId },
            talent: { id: talentId },
            status: MessageRequestStatus.ACCEPTED,
          },
        }),
        this.threadRepo.findOne({
          where: {
            recruiter: { id: recruiterId },
            talent: { id: talentId },
          },
        }),
        this.requestRepo.findOne({
          where: {
            recruiter: { id: recruiterId },
            talent: { id: talentId },
            status: MessageRequestStatus.DECLINED,
          },
          order: { responded_at: "DESC", updated_at: "DESC" },
        }),
      ]);

    if (pendingRequest) {
      throw new ConflictError(
        "A message request to this talent is already pending",
      );
    }

    if (acceptedRequest || existingThread) {
      throw new ConflictError("A conversation with this talent already exists");
    }

    if (
      declinedRequest &&
      this.isWithinDeclineCooldownPeriod(declinedRequest)
    ) {
      throw new ConflictError(
        "You cannot send another request to this talent yet",
      );
    }
  }

  private assertTalentCanRespondToRequest(
    request: MessageRequestEntity | null,
    talentId: string,
  ): asserts request is MessageRequestEntity {
    if (!request || request.talent.id !== talentId) {
      throw new NotFoundError("Message request not found");
    }

    if (request.status !== MessageRequestStatus.PENDING) {
      throw new ConflictError(
        `Message request has already been ${request.status}`,
      );
    }
  }

  private async createInitialMessageFromRequest(
    messageRepo: Repository<MessageEntity>,
    request: MessageRequestEntity,
    thread: ConversationThreadEntity,
  ): Promise<MessageEntity | null> {
    const introNote = this.normalizeIntroNote(request.intro_note || undefined);

    if (!introNote) {
      return null;
    }

    const initialMessage = messageRepo.create({
      thread,
      sender: request.recruiter,
      source_request: request,
      body: introNote,
      created_at: request.created_at,
      updated_at: request.created_at,
    });

    return messageRepo.save(initialMessage);
  }

  private isApprovedTalent(user: UserEntity | null): user is UserEntity & {
    talent_profile: TalentProfileEntity;
  } {
    return Boolean(
      user?.role === UserRole.TALENT &&
        user.profile_completed &&
        user.talent_profile?.profile_status === ProfileStatus.APPROVED,
    );
  }

  private isWithinDeclineCooldownPeriod(
    request: MessageRequestEntity,
  ): boolean {
    const declinedAt =
      request.responded_at || request.updated_at || request.created_at;
    const cooldownEndsAt = new Date(
      declinedAt.getTime() + this.declineCooldownDays * 24 * 60 * 60 * 1000,
    );

    return cooldownEndsAt > new Date();
  }

  private get declineCooldownDays(): number {
    const configuredDays = config.has("MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS")
      ? Number(config.get<number>("MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS"))
      : 30;

    return Number.isFinite(configuredDays) && configuredDays > 0
      ? configuredDays
      : 30;
  }

  private normalizeIntroNote(introNote?: string): string | null {
    const normalized = introNote?.trim();
    return normalized ? normalized : null;
  }

  private formatMessageRequest(
    request: MessageRequestEntity,
  ): MessageRequestSummary {
    return {
      id: request.id,
      intro_note: request.intro_note,
      status: request.status,
      responded_at: request.responded_at,
      created_at: request.created_at,
      updated_at: request.updated_at,
      recruiter: this.formatUser(request.recruiter),
      talent: this.formatUser(request.talent),
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
}
