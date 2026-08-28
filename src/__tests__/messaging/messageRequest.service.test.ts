import AppDataSource from "@src/datasource";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageEntity } from "@src/entities/message.entity";
import {
  MessageRequestEntity,
  MessageRequestStatus,
} from "@src/entities/messageRequest.entity";
import { ProfileStatus } from "@src/entities/talentProfile.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { ConflictError } from "@src/exceptions/conflictError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { MessageRequestService } from "@src/messaging/services/messageRequest.service";
import config from "config";

const mockMessagingEngagementService = {
  onMessageRequestCreated: jest.fn(),
  onMessageRequestAccepted: jest.fn(),
  onMessageRequestDeclined: jest.fn(),
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

jest.mock("config", () => ({
  __esModule: true,
  default: {
    has: jest.fn(),
    get: jest.fn(),
  },
}));

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockRequestRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
};

const mockThreadRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockMessageRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockTransactionManager = {
  getRepository: jest.fn(),
};

const now = new Date("2026-07-28T12:00:00.000Z");

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
  profile_completed: true,
  talent_profile: {
    profile_status: ProfileStatus.APPROVED,
  },
} as UserEntity;

const buildRequest = (
  overrides: Partial<MessageRequestEntity> = {},
): MessageRequestEntity =>
  ({
    id: "33333333-3333-4333-8333-333333333333",
    intro_note: "We would like to chat.",
    status: MessageRequestStatus.PENDING,
    responded_at: null,
    created_at: now,
    updated_at: now,
    recruiter,
    talent,
    ...overrides,
  }) as MessageRequestEntity;

const buildThread = (
  overrides: Partial<ConversationThreadEntity> = {},
): ConversationThreadEntity =>
  ({
    id: "44444444-4444-4444-8444-444444444444",
    recruiter_last_seen_at: null,
    talent_last_seen_at: null,
    latest_message_at: null,
    created_at: now,
    updated_at: now,
    accepted_request: null,
    recruiter,
    talent,
    ...overrides,
  }) as ConversationThreadEntity;

const buildMessage = (overrides: Partial<MessageEntity> = {}): MessageEntity =>
  ({
    id: "55555555-5555-4555-8555-555555555555",
    body: "We would like to chat.",
    created_at: now,
    updated_at: now,
    sender: recruiter,
    source_request: null,
    thread: buildThread(),
    ...overrides,
  }) as MessageEntity;

const mockUsersFound = () => {
  mockUserRepo.findOne.mockImplementation(({ where }) => {
    if (where.role === UserRole.RECRUITER) return Promise.resolve(recruiter);
    if (where.role === UserRole.TALENT) return Promise.resolve(talent);
    return Promise.resolve(null);
  });
};

const mockNoExistingRequestState = () => {
  mockRequestRepo.findOne.mockResolvedValue(null);
  mockThreadRepo.findOne.mockResolvedValue(null);
};

describe("MessageRequestService", () => {
  let service: MessageRequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    (config.has as jest.Mock).mockReturnValue(true);
    (config.get as jest.Mock).mockReturnValue(30);

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === UserEntity) return mockUserRepo;
      if (entity === MessageRequestEntity) return mockRequestRepo;
      if (entity === ConversationThreadEntity) return mockThreadRepo;
      if (entity === MessageEntity) return mockMessageRepo;
      return {};
    });

    (AppDataSource.manager.transaction as jest.Mock).mockImplementation(
      async (callback) => callback(mockTransactionManager),
    );

    mockTransactionManager.getRepository.mockImplementation((entity) => {
      if (entity === MessageRequestEntity) return mockRequestRepo;
      if (entity === ConversationThreadEntity) return mockThreadRepo;
      if (entity === MessageEntity) return mockMessageRepo;
      return {};
    });

    service = new MessageRequestService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("createMessageRequest", () => {
    it("creates a pending request with a normalized intro note", async () => {
      mockUsersFound();
      mockNoExistingRequestState();

      const savedRequest = buildRequest({ intro_note: "Hello there" });
      mockRequestRepo.create.mockImplementation((payload) => ({
        ...payload,
        id: savedRequest.id,
        created_at: now,
        updated_at: now,
        responded_at: null,
      }));
      mockRequestRepo.save.mockResolvedValue(savedRequest);

      const result = await service.createMessageRequest(recruiter.id, {
        talent_id: talent.id,
        intro_note: "  Hello there  ",
      });

      expect(mockRequestRepo.create).toHaveBeenCalledWith({
        recruiter,
        talent,
        intro_note: "Hello there",
        status: MessageRequestStatus.PENDING,
      });
      expect(mockRequestRepo.save).toHaveBeenCalled();
      expect(
        mockMessagingEngagementService.onMessageRequestCreated,
      ).toHaveBeenCalledWith(savedRequest);
      expect(result).toEqual({
        id: savedRequest.id,
        intro_note: "Hello there",
        status: MessageRequestStatus.PENDING,
        responded_at: null,
        created_at: now,
        updated_at: now,
        recruiter: {
          id: recruiter.id,
          first_name: recruiter.first_name,
          last_name: recruiter.last_name,
          avatar: recruiter.avatar,
          role: recruiter.role,
        },
        talent: {
          id: talent.id,
          first_name: talent.first_name,
          last_name: talent.last_name,
          avatar: talent.avatar,
          role: talent.role,
        },
      });
    });

    it("rejects self-requests", async () => {
      await expect(
        service.createMessageRequest(recruiter.id, {
          talent_id: recruiter.id,
        }),
      ).rejects.toThrow(ClientError);

      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
      expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });

    it("rejects missing or unapproved talents", async () => {
      mockUserRepo.findOne.mockImplementation(({ where }) => {
        if (where.role === UserRole.RECRUITER)
          return Promise.resolve(recruiter);
        return Promise.resolve(null);
      });

      await expect(
        service.createMessageRequest(recruiter.id, {
          talent_id: talent.id,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });

    it("rejects duplicate pending requests", async () => {
      mockUsersFound();
      mockThreadRepo.findOne.mockResolvedValue(null);
      mockRequestRepo.findOne.mockImplementation(({ where }) =>
        Promise.resolve(
          where.status === MessageRequestStatus.PENDING ? buildRequest() : null,
        ),
      );

      await expect(
        service.createMessageRequest(recruiter.id, {
          talent_id: talent.id,
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });

    it("rejects requests when a conversation already exists", async () => {
      mockUsersFound();
      mockRequestRepo.findOne.mockResolvedValue(null);
      mockThreadRepo.findOne.mockResolvedValue({
        id: "thread-id",
      } as ConversationThreadEntity);

      await expect(
        service.createMessageRequest(recruiter.id, {
          talent_id: talent.id,
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });

    it("rejects declined requests still inside the cooldown window", async () => {
      mockUsersFound();
      mockThreadRepo.findOne.mockResolvedValue(null);
      mockRequestRepo.findOne.mockImplementation(({ where }) =>
        Promise.resolve(
          where.status === MessageRequestStatus.DECLINED
            ? buildRequest({
                status: MessageRequestStatus.DECLINED,
                responded_at: new Date("2026-07-10T12:00:00.000Z"),
              })
            : null,
        ),
      );

      await expect(
        service.createMessageRequest(recruiter.id, {
          talent_id: talent.id,
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("acceptMessageRequest", () => {
    it("accepts a pending request, creates a thread, and converts the intro note into the first message", async () => {
      const request = buildRequest({
        intro_note: "We would like to schedule an interview.",
      });
      const savedThread = buildThread({
        accepted_request: request,
      });
      const initialMessage = buildMessage({
        body: request.intro_note,
        source_request: request,
        thread: savedThread,
      });

      mockRequestRepo.findOne.mockResolvedValue(request);
      mockRequestRepo.save.mockImplementation(async (entity) => entity);
      mockThreadRepo.findOne.mockResolvedValue(null);
      mockThreadRepo.create.mockReturnValue(savedThread);
      mockThreadRepo.save.mockImplementation(async (entity) => ({
        ...entity,
        id: entity.id || savedThread.id,
        created_at: entity.created_at || now,
        updated_at: now,
      }));
      mockMessageRepo.create.mockReturnValue(initialMessage);
      mockMessageRepo.save.mockResolvedValue(initialMessage);

      const result = await service.acceptMessageRequest(talent.id, request.id);

      expect(AppDataSource.manager.transaction).toHaveBeenCalled();
      expect(mockRequestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageRequestStatus.ACCEPTED,
          responded_at: now,
        }),
      );
      expect(mockThreadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiter,
          talent,
          accepted_request: request,
          latest_message_at: null,
        }),
      );
      expect(mockMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thread: expect.objectContaining({ id: savedThread.id }),
          sender: recruiter,
          source_request: request,
          body: request.intro_note,
          created_at: request.created_at,
          updated_at: request.created_at,
        }),
      );
      expect(mockThreadRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          latest_message_at: initialMessage.created_at,
        }),
      );
      expect(result.request.status).toBe(MessageRequestStatus.ACCEPTED);
      expect(result.thread.accepted_request_id).toBe(request.id);
      expect(result.initial_message).toEqual(
        expect.objectContaining({
          body: request.intro_note,
          source_request_id: request.id,
        }),
      );
      expect(
        mockMessagingEngagementService.onMessageRequestAccepted,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: request.id }));
    });

    it("accepts a request without an intro note without creating an initial message", async () => {
      const request = buildRequest({ intro_note: null });
      const savedThread = buildThread({
        accepted_request: request,
      });

      mockRequestRepo.findOne.mockResolvedValue(request);
      mockRequestRepo.save.mockImplementation(async (entity) => entity);
      mockThreadRepo.findOne.mockResolvedValue(null);
      mockThreadRepo.create.mockReturnValue(savedThread);
      mockThreadRepo.save.mockResolvedValue(savedThread);

      const result = await service.acceptMessageRequest(talent.id, request.id);

      expect(mockMessageRepo.create).not.toHaveBeenCalled();
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
      expect(result.request.status).toBe(MessageRequestStatus.ACCEPTED);
      expect(result.thread.accepted_request_id).toBe(request.id);
      expect(result.initial_message).toBeNull();
    });

    it("rejects accept attempts for requests that do not belong to the talent", async () => {
      const request = buildRequest();
      mockRequestRepo.findOne.mockResolvedValue(request);

      await expect(
        service.acceptMessageRequest(
          "99999999-9999-4999-8999-999999999999",
          request.id,
        ),
      ).rejects.toThrow(NotFoundError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
      expect(mockThreadRepo.save).not.toHaveBeenCalled();
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });

    it("rejects accept attempts for requests that are no longer pending", async () => {
      const request = buildRequest({
        status: MessageRequestStatus.DECLINED,
      });
      mockRequestRepo.findOne.mockResolvedValue(request);

      await expect(
        service.acceptMessageRequest(talent.id, request.id),
      ).rejects.toThrow(ConflictError);

      expect(mockRequestRepo.save).not.toHaveBeenCalled();
      expect(mockThreadRepo.save).not.toHaveBeenCalled();
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("declineMessageRequest", () => {
    it("declines a pending request without creating a thread or message", async () => {
      const request = buildRequest();
      mockRequestRepo.findOne.mockResolvedValue(request);
      mockRequestRepo.save.mockImplementation(async (entity) => entity);

      const result = await service.declineMessageRequest(talent.id, request.id);

      expect(AppDataSource.manager.transaction).toHaveBeenCalled();
      expect(mockRequestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MessageRequestStatus.DECLINED,
          responded_at: now,
        }),
      );
      expect(mockThreadRepo.create).not.toHaveBeenCalled();
      expect(mockThreadRepo.save).not.toHaveBeenCalled();
      expect(mockMessageRepo.create).not.toHaveBeenCalled();
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
      expect(result.status).toBe(MessageRequestStatus.DECLINED);
      expect(result.responded_at).toEqual(now);
      expect(
        mockMessagingEngagementService.onMessageRequestDeclined,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: request.id }));
    });
  });

  describe("getIncomingRequests", () => {
    it("lists requests for a talent and keeps personal email out of the response", async () => {
      const request = buildRequest();
      mockRequestRepo.findAndCount.mockResolvedValue([[request], 1]);

      const result = await service.getIncomingRequests(talent.id, {
        status: MessageRequestStatus.PENDING,
        page: 1,
        limit: 10,
      });

      expect(mockRequestRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          talent: { id: talent.id },
          status: MessageRequestStatus.PENDING,
        },
        relations: ["recruiter", "talent"],
        order: { created_at: "DESC" },
        skip: 0,
        take: 10,
      });
      expect(result.requests[0].recruiter).not.toHaveProperty("email");
      expect(result.requests[0].talent).not.toHaveProperty("email");
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe("getOutgoingRequests", () => {
    it("lists requests for a recruiter", async () => {
      const request = buildRequest({ status: MessageRequestStatus.DECLINED });
      mockRequestRepo.findAndCount.mockResolvedValue([[request], 3]);

      const result = await service.getOutgoingRequests(recruiter.id, {
        status: MessageRequestStatus.DECLINED,
        page: 2,
        limit: 5,
      });

      expect(mockRequestRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          recruiter: { id: recruiter.id },
          status: MessageRequestStatus.DECLINED,
        },
        relations: ["recruiter", "talent"],
        order: { created_at: "DESC" },
        skip: 5,
        take: 5,
      });
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].status).toBe(MessageRequestStatus.DECLINED);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });
});
