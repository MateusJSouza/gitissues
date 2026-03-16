"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createRepositorySchema,
  type CreateRepositoryInput,
} from "@/lib/validations";
import type { ActionResult, RepositoryWithOwner } from "@/types";
import { revalidatePath } from "next/cache";

// ─── createRepository ─────────────────────────────────────────────────────────

export async function createRepository(
  input: CreateRepositoryInput
): Promise<ActionResult<RepositoryWithOwner>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = createRepositorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, description } = parsed.data;

    // Verifica se já existe um repositório com este nome para o usuário
    const existing = await prisma.repository.findUnique({
      where: {
        ownerId_name: {
          ownerId: session.user.id,
          name,
        },
      },
    });
    if (existing) {
      return { success: false, error: "Você já possui um repositório com este nome" };
    }

    const repository = await prisma.repository.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
      },
      include: {
        owner: { select: { id: true, name: true, image: true, githubUsername: true } },
        _count: { select: { issues: true } },
      },
    });

    revalidatePath("/dashboard");

    return { success: true, data: repository as RepositoryWithOwner };
  } catch (error) {
    console.error("[createRepository]", error);
    return { success: false, error: "Erro ao criar repositório" };
  }
}
