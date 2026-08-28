import { MessageRequestStatus } from "@src/entities/messageRequest.entity";
import { z } from "zod";

export const createMessageRequestSchema = z.object({
  talent_id: z.string().uuid(),
  intro_note: z.string().trim().max(2000).optional(),
});

export const listMessageRequestsSchema = z.object({
  status: z.nativeEnum(MessageRequestStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const messageRequestParamsSchema = z.object({
  requestId: z.string().uuid(),
});

export type CreateMessageRequestDto = z.infer<
  typeof createMessageRequestSchema
>;

export type ListMessageRequestsDto = z.infer<typeof listMessageRequestsSchema>;
