import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
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
import config from "config";
import {
  CreateMessageRequestDto,
  ListMessageRequestsDto,
} from "../schemas/messageRequest.schema";

interface MessageRequestUserSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: UserRole | null;
}

export interface MessageRequestSummary {
  id: string;
  intro_note: string | null;
  status: MessageRequestStatus;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  recruiter: MessageRequestUserSummary;
  talent: MessageRequestUserSummary;
}

export interface MessageRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedMessageRequestSummary {
  requests: MessageRequestSummary[];
  pagination: MessageRequestPagination;
}

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

  private formatUser(user: UserEntity): MessageRequestUserSummary {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      role: user.role,
    };
  }
}
