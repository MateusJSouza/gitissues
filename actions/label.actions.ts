"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createLabelSchema,
  updateLabelSchema,
  type CreateLabelInput,
  type UpdateLabelInput,
} from "@/lib/validations";
import type { ActionResult, Label } from "@/types";
import { revalidatePath } from "next/cache";

// ─── createLabel ──────────────────────────────────────────────────────────────

export async function createLabel(
  input: CreateLabelInput
): Promise<ActionResult<Label>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = createLabelSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, color, repositoryId } = parsed.data;

    // Verifica se o repositório pertence ao usuário autenticado
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) {
      return { success: false, error: "Repositório não encontrado" };
    }
    if (repository.ownerId !== session.user.id) {
      return { success: false, error: "Sem permissão neste repositório" };
    }

    const label = await prisma.label.create({
      data: { name, color, repositoryId },
    });

    revalidatePath(`/${session.user.id}/${repository.name}/issues`);

    return { success: true, data: label };
  } catch (error) {
    console.error("[createLabel]", error);
    return { success: false, error: "Erro ao criar label" };
  }
}

// ─── updateLabel ──────────────────────────────────────────────────────────────

export async function updateLabel(
  input: UpdateLabelInput
): Promise<ActionResult<Label>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = updateLabelSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { id, name, color } = parsed.data;

    const existing = await prisma.label.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Label não encontrada" };
    }
    if (existing.repository.ownerId !== session.user.id) {
      return { success: false, error: "Sem permissão para editar esta label" };
    }

    const label = await prisma.label.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return { success: true, data: label };
  } catch (error) {
    console.error("[updateLabel]", error);
    return { success: false, error: "Erro ao atualizar label" };
  }
}

// ─── deleteLabel ──────────────────────────────────────────────────────────────

export async function deleteLabel(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const existing = await prisma.label.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Label não encontrada" };
    }
    if (existing.repository.ownerId !== session.user.id) {
      return { success: false, error: "Sem permissão para deletar esta label" };
    }

    await prisma.label.delete({ where: { id } });

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[deleteLabel]", error);
    return { success: false, error: "Erro ao deletar label" };
  }
}
