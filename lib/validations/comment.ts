import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comentário não pode ser vazio").max(65535, "Comentário muito longo"),
  issueId: z.string().cuid("ID da issue inválido"),
});

export const updateCommentSchema = z.object({
  id: z.string().cuid("ID do comentário inválido"),
  body: z.string().min(1, "Comentário não pode ser vazio").max(65535, "Comentário muito longo"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
