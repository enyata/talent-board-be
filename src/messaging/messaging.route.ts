import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import {
  acceptMessageRequest,
  createMessageRequest,
  declineMessageRequest,
  getConversationInbox,
  getConversationMessages,
  getIncomingMessageRequests,
  getMessageTemplates,
  getOutgoingMessageRequests,
  markConversationThreadSeen,
  sendConversationMessage,
} from "./messaging.controller";
import {
  conversationThreadParamsSchema,
  listConversationMessagesSchema,
  listConversationThreadsSchema,
  markConversationThreadSeenSchema,
  sendConversationMessageSchema,
} from "./schemas/conversation.schema";
import {
  createMessageRequestSchema,
  listMessageRequestsSchema,
  messageRequestParamsSchema,
} from "./schemas/messageRequest.schema";
import { listMessageTemplatesSchema } from "./schemas/template.schema";

const router = Router();

router.use(deserializeUser);

router.get(
  "/threads",
  checkRole([UserRole.RECRUITER, UserRole.TALENT]),
  validateData(listConversationThreadsSchema, ["query"]),
  getConversationInbox,
);

router.get(
  "/threads/:threadId/messages",
  checkRole([UserRole.RECRUITER, UserRole.TALENT]),
  validateData(conversationThreadParamsSchema, ["params"]),
  validateData(listConversationMessagesSchema, ["query"]),
  getConversationMessages,
);

router.patch(
  "/threads/:threadId/seen",
  checkRole([UserRole.RECRUITER, UserRole.TALENT]),
  validateData(conversationThreadParamsSchema, ["params"]),
  validateData(markConversationThreadSeenSchema),
  markConversationThreadSeen,
);

router.post(
  "/threads/:threadId/messages",
  checkRole([UserRole.RECRUITER, UserRole.TALENT]),
  validateData(conversationThreadParamsSchema, ["params"]),
  validateData(sendConversationMessageSchema),
  sendConversationMessage,
);

router.post(
  "/requests",
  checkRole(UserRole.RECRUITER),
  validateData(createMessageRequestSchema),
  createMessageRequest,
);

router.get(
  "/requests/incoming",
  checkRole(UserRole.TALENT),
  validateData(listMessageRequestsSchema, ["query"]),
  getIncomingMessageRequests,
);

router.get(
  "/requests/outgoing",
  checkRole(UserRole.RECRUITER),
  validateData(listMessageRequestsSchema, ["query"]),
  getOutgoingMessageRequests,
);

router.get(
  "/templates",
  checkRole([UserRole.RECRUITER, UserRole.TALENT]),
  validateData(listMessageTemplatesSchema, ["query"]),
  getMessageTemplates,
);

router.patch(
  "/requests/:requestId/accept",
  checkRole(UserRole.TALENT),
  validateData(messageRequestParamsSchema, ["params"]),
  acceptMessageRequest,
);

router.patch(
  "/requests/:requestId/decline",
  checkRole(UserRole.TALENT),
  validateData(messageRequestParamsSchema, ["params"]),
  declineMessageRequest,
);

export default router;
