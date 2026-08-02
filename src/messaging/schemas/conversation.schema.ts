import { z } from "zod";

export const conversationThreadParamsSchema = z.object({
  threadId: z.string().uuid(),
});

export const listConversationThreadsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listConversationMessagesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const sendConversationMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export type ListConversationThreadsDto = z.infer<
  typeof listConversationThreadsSchema
>;

export type ListConversationMessagesDto = z.infer<
  typeof listConversationMessagesSchema
>;

export type SendConversationMessageDto = z.infer<
  typeof sendConversationMessageSchema
>;
