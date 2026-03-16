"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCommentSchema,
  updateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from "@/lib/validations";
import type { ActionResult, CommentWithAuthor } from "@/types";
import { revalidatePath } from "next/cache";

// ─── createComment ────────────────────────────────────────────────────────────

export async function createComment(
  input: CreateCommentInput
): Promise<ActionResult<CommentWithAuthor>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = createCommentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { body, issueId } = parsed.data;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { repository: true },
    });
    if (!issue) {
      return { success: false, error: "Issue não encontrada" };
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        issueId,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, githubUsername: true } },
      },
    });

    revalidatePath(`/${issue.repository.ownerId}/${issue.repository.name}/issues/${issue.number}`);

    return { success: true, data: comment as CommentWithAuthor };
  } catch (error) {
    console.error("[createComment]", error);
    return { success: false, error: "Erro ao criar comentário" };
  }
}

// ─── updateComment ────────────────────────────────────────────────────────────

export async function updateComment(
  input: UpdateCommentInput
): Promise<ActionResult<CommentWithAuthor>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = updateCommentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { id, body } = parsed.data;

    const existing = await prisma.comment.findUnique({
      where: { id },
      include: {
        issue: { include: { repository: true } },
      },
    });
    if (!existing) {
      return { success: false, error: "Comentário não encontrado" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para editar este comentário" };
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { body },
      include: {
        author: { select: { id: true, name: true, image: true, githubUsername: true } },
      },
    });

    revalidatePath(
      `/${existing.issue.repository.ownerId}/${existing.issue.repository.name}/issues/${existing.issue.number}`
    );

    return { success: true, data: comment as CommentWithAuthor };
  } catch (error) {
    console.error("[updateComment]", error);
    return { success: false, error: "Erro ao atualizar comentário" };
  }
}

// ─── deleteComment ────────────────────────────────────────────────────────────

export async function deleteComment(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const existing = await prisma.comment.findUnique({
      where: { id },
      include: {
        issue: { include: { repository: true } },
      },
    });
    if (!existing) {
      return { success: false, error: "Comentário não encontrado" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para deletar este comentário" };
    }

    await prisma.comment.delete({ where: { id } });

    revalidatePath(
      `/${existing.issue.repository.ownerId}/${existing.issue.repository.name}/issues/${existing.issue.number}`
    );

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[deleteComment]", error);
    return { success: false, error: "Erro ao deletar comentário" };
  }
}
