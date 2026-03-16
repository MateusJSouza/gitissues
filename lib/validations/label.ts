import { z } from "zod";

// Valida cores HEX (#rrggbb)
const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const createLabelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  color: z
    .string()
    .regex(hexColorRegex, "Cor deve estar no formato hexadecimal (#rrggbb)")
    .default("#e2e8f0"),
  repositoryId: z.string().cuid("ID do repositório inválido"),
});

export const updateLabelSchema = z.object({
  id: z.string().cuid("ID da label inválido"),
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Cor deve estar no formato hexadecimal (#rrggbb)")
    .optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
