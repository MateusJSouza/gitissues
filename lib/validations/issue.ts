import { z } from "zod";
import { IssueStatus } from "@prisma/client";

export const createIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  body: z.string().optional(),
  repositoryId: z.string().cuid("ID do repositório inválido"),
  assigneeId: z.string().cuid("ID do assignee inválido").optional(),
  labelIds: z.array(z.string().cuid()).optional().default([]),
});

export const updateIssueSchema = z.object({
  id: z.string().cuid("ID da issue inválido"),
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres")
    .optional(),
  body: z.string().optional(),
  assigneeId: z.string().cuid("ID do assignee inválido").nullable().optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const changeIssueStatusSchema = z.object({
  id: z.string().cuid("ID da issue inválido"),
  status: z.nativeEnum(IssueStatus),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type ChangeIssueStatusInput = z.infer<typeof changeIssueStatusSchema>;
