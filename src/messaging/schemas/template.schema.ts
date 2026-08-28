import { z } from "zod";

export const listMessageTemplatesSchema = z.object({
  use_case: z.enum(["intro_note", "active_message_compose"]).optional(),
  target_user_id: z.string().uuid(),
});

export type ListMessageTemplatesDto = z.infer<
  typeof listMessageTemplatesSchema
>;
