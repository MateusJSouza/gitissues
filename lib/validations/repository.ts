import { z } from "zod";

// Segue as regras de nomenclatura do GitHub: letras, números, hífens e underscores
const repoNameRegex = /^[a-zA-Z0-9_.-]+$/;

export const createRepositorySchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(
      repoNameRegex,
      "Nome deve conter apenas letras, números, hífens, underscores e pontos"
    ),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
});

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
