import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageEntity } from "@src/entities/message.entity";
import {
  MessageRequestEntity,
  MessageRequestStatus,
} from "@src/entities/messageRequest.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { ConversationService } from "@src/messaging/services/conversation.service";

const mockMessagingEngagementService = {
  onMessageSent: jest.fn(),
};

jest.mock("@src/messaging/services/messagingEngagement.service", () => ({
  MessagingEngagementService: jest
    .fn()
    .mockImplementation(() => mockMessagingEngagementService),
}));

jest.mock("@src/datasource", () => ({
  __esModule: true,
  default: {
    getRepository: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  },
}));

const mockThreadRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockMessageRepo = {
  create: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockTransactionManager = {
  getRepository: jest.fn(),
};

const now = new Date("2026-08-01T10:00:00.000Z");
const later = new Date("2026-08-01T10:05:00.000Z");

const recruiter = {
  id: "11111111-1111-4111-8111-111111111111",
  first_name: "Ada",
  last_name: "Recruiter",
  avatar: null,
  role: UserRole.RECRUITER,
} as UserEntity;

const talent = {
  id: "22222222-2222-4222-8222-222222222222",
  first_name: "Tola",
  last_name: "Talent",
  avatar: "uploads/avatars/tola.png",
  role: UserRole.TALENT,
} as UserEntity;

const acceptedRequest = {
  id: "33333333-3333-4333-8333-333333333333",
  status: MessageRequestStatus.ACCEPTED,
  recruiter,
  talent,
} as MessageRequestEntity;

const buildThread = (
  overrides: Partial<ConversationThreadEntity> = {},
): ConversationThreadEntity =>
  ({
    id: "44444444-4444-4444-8444-444444444444",
    recruiter,
    talent,
    accepted_request: acceptedRequest,
    recruiter_last_seen_at: null,
    talent_last_seen_at: null,
    latest_message_at: later,
    created_at: now,
    updated_at: later,
    ...overrides,
  }) as ConversationThreadEntity;

const buildMessage = (overrides: Partial<MessageEntity> = {}): MessageEntity =>
  ({
    id: "55555555-5555-4555-8555-555555555555",
    body: "Hello there",
    sender: recruiter,
    source_request: null,
    thread: buildThread(),
    created_at: later,
    updated_at: later,
    ...overrides,
  }) as MessageEntity;

describe("ConversationService", () => {
  let service: ConversationService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(later);

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === ConversationThreadEntity) return mockThreadRepo;
      if (entity === MessageEntity) return mockMessageRepo;
      return {};
    });

    (AppDataSource.manager.transaction as jest.Mock).mockImplementation(
      async (callback) => callback(mockTransactionManager),
    );

    mockTransactionManager.getRepository.mockImplementation((entity) => {
      if (entity === ConversationThreadEntity) return mockThreadRepo;
      if (entity === MessageEntity) return mockMessageRepo;
      return {};
    });

    service = new ConversationService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getInbox", () => {
    it("lists active recruiter threads with latest message summaries", async () => {
      const thread = buildThread();
      const latestMessage = buildMessage({ body: "Latest update" });
      mockThreadRepo.findAndCount.mockResolvedValue([[thread], 1]);
      mockMessageRepo.findOne.mockResolvedValue(latestMessage);

      const result = await service.getInbox(recruiter.id, UserRole.RECRUITER, {
        page: 1,
        limit: 20,
      });

      expect(mockThreadRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          recruiter: { id: recruiter.id },
          accepted_request: { status: MessageRequestStatus.ACCEPTED },
        },
        relations: ["recruiter", "talent", "accepted_request"],
        order: { latest_message_at: "DESC", updated_at: "DESC" },
        skip: 0,
        take: 20,
      });
      expect(mockMessageRepo.findOne).toHaveBeenCalledWith({
        where: { thread: { id: thread.id } },
        relations: ["sender", "source_request"],
        order: { created_at: "DESC" },
      });
      expect(result.threads[0].conversation_partner.id).toBe(talent.id);
      expect(result.threads[0].latest_message?.body).toBe("Latest update");
      expect(result.threads[0].latest_message_seen_at).toBeNull();
      expect(result.threads[0].latest_message_seen_status).toBe("unseen");
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe("getMessages", () => {
    it("loads the most recent message page and returns that page in chronological order", async () => {
      const thread = buildThread();
      const messages = [
        buildMessage({ id: "message-2", body: "Second", created_at: later }),
        buildMessage({ id: "message-1", body: "First", created_at: now }),
      ];
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.findAndCount.mockResolvedValue([messages, 2]);

      const result = await service.getMessages(recruiter.id, thread.id, {
        page: 1,
        limit: 50,
      });

      expect(mockThreadRepo.findOne).toHaveBeenCalledWith({
        where: { id: thread.id },
        relations: ["recruiter", "talent", "accepted_request"],
      });
      expect(mockMessageRepo.findAndCount).toHaveBeenCalledWith({
        where: { thread: { id: thread.id } },
        relations: ["sender", "source_request"],
        order: { created_at: "DESC" },
        skip: 0,
        take: 50,
      });
      expect(result.messages.map((message) => message.body)).toEqual([
        "First",
        "Second",
      ]);
    });

    it("hides threads from non-participants", async () => {
      const thread = buildThread();
      mockThreadRepo.findOne.mockResolvedValue(thread);

      await expect(
        service.getMessages("99999999-9999-4999-8999-999999999999", thread.id, {
          page: 1,
          limit: 50,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(mockMessageRepo.findAndCount).not.toHaveBeenCalled();
    });

    it("blocks messages for inactive threads", async () => {
      const thread = buildThread({ accepted_request: null });
      mockThreadRepo.findOne.mockResolvedValue(thread);

      await expect(
        service.getMessages(recruiter.id, thread.id, {
          page: 1,
          limit: 50,
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockMessageRepo.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe("sendMessage", () => {
    it("sends a message in an active thread and updates latest activity", async () => {
      const thread = buildThread();
      const body = "Thanks for accepting.\nCan we schedule a call?";
      const savedMessage = buildMessage({
        body,
        sender: talent,
        thread,
        created_at: later,
      });

      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockMessageRepo.create.mockReturnValue(savedMessage);
      mockMessageRepo.save.mockResolvedValue(savedMessage);
      mockThreadRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.sendMessage(talent.id, thread.id, { body });

      expect(AppDataSource.manager.transaction).toHaveBeenCalled();
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        thread,
        sender: talent,
        body,
        source_request: null,
      });
      expect(mockMessageRepo.save).toHaveBeenCalledWith(savedMessage);
      expect(mockThreadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          latest_message_at: later,
          talent_last_seen_at: later,
        }),
      );
      expect(mockMessagingEngagementService.onMessageSent).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: talent,
          body,
        }),
      );
      expect(result.message.body).toBe(body);
      expect(result.thread.latest_message_at).toEqual(later);
      expect(result.thread.latest_message_seen_at).toEqual(later);
      expect(result.thread.latest_message_seen_status).toBe("seen");
    });

    it("blocks sending to inactive threads", async () => {
      const thread = buildThread({
        accepted_request: {
          ...acceptedRequest,
          status: MessageRequestStatus.DECLINED,
        } as MessageRequestEntity,
      });
      mockThreadRepo.findOne.mockResolvedValue(thread);

      await expect(
        service.sendMessage(recruiter.id, thread.id, { body: "Hello" }),
      ).rejects.toThrow(ConflictError);

      expect(mockMessageRepo.save).not.toHaveBeenCalled();
      expect(mockThreadRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("markThreadAsSeen", () => {
    it("updates participant seen timestamp and returns seen status", async () => {
      const thread = buildThread({ recruiter_last_seen_at: null });
      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockThreadRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.markThreadAsSeen(
        recruiter.id,
        thread.id,
        {},
      );

      expect(AppDataSource.manager.transaction).toHaveBeenCalled();
      expect(mockThreadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_last_seen_at: later }),
      );
      expect(result.latest_message_seen_at).toEqual(later);
      expect(result.latest_message_seen_status).toBe("seen");
    });

    it("keeps the later seen timestamp when an older timestamp is provided", async () => {
      const existingSeenAt = new Date("2026-08-01T10:06:00.000Z");
      const olderSeenAt = new Date("2026-08-01T10:04:00.000Z");
      const thread = buildThread({ recruiter_last_seen_at: existingSeenAt });

      mockThreadRepo.findOne.mockResolvedValue(thread);
      mockThreadRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.markThreadAsSeen(recruiter.id, thread.id, {
        seen_at: olderSeenAt,
      });

      expect(mockThreadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_last_seen_at: existingSeenAt }),
      );
      expect(result.latest_message_seen_at).toEqual(existingSeenAt);
      expect(result.latest_message_seen_status).toBe("seen");
    });
  });
});
