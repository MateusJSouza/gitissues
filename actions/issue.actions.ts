"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createIssueSchema,
  updateIssueSchema,
  type CreateIssueInput,
  type UpdateIssueInput,
} from "@/lib/validations";
import type { ActionResult, IssueWithRelations } from "@/types";
import { revalidatePath } from "next/cache";

// ─── createIssue ──────────────────────────────────────────────────────────────

export async function createIssue(
  input: CreateIssueInput
): Promise<ActionResult<IssueWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = createIssueSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { title, body, repositoryId, assigneeId, labelIds } = parsed.data;

    // Verifica se o repositório existe e pertence ao usuário
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });
    if (!repository) {
      return { success: false, error: "Repositório não encontrado" };
    }

    // Calcula o próximo número da issue no repositório
    const lastIssue = await prisma.issue.findFirst({
      where: { repositoryId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (lastIssue?.number ?? 0) + 1;

    const issue = await prisma.issue.create({
      data: {
        number: nextNumber,
        title,
        body,
        repositoryId,
        authorId: session.user.id,
        assigneeId: assigneeId ?? null,
        labels: labelIds?.length ? { connect: labelIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, image: true, githubUsername: true } },
        assignee: { select: { id: true, name: true, image: true, githubUsername: true } },
        repository: { select: { id: true, name: true } },
        labels: true,
        _count: { select: { comments: true } },
      },
    });

    revalidatePath(`/${repository.ownerId}/${repository.name}/issues`);

    return { success: true, data: issue as IssueWithRelations };
  } catch (error) {
    console.error("[createIssue]", error);
    return { success: false, error: "Erro ao criar issue" };
  }
}

// ─── updateIssue ──────────────────────────────────────────────────────────────

export async function updateIssue(
  input: UpdateIssueInput
): Promise<ActionResult<IssueWithRelations>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const parsed = updateIssueSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { id, title, body, assigneeId, labelIds } = parsed.data;

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Issue não encontrada" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para editar esta issue" };
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(labelIds !== undefined && {
          labels: {
            set: labelIds.map((labelId) => ({ id: labelId })),
          },
        }),
      },
      include: {
        author: { select: { id: true, name: true, image: true, githubUsername: true } },
        assignee: { select: { id: true, name: true, image: true, githubUsername: true } },
        repository: { select: { id: true, name: true } },
        labels: true,
        _count: { select: { comments: true } },
      },
    });

    revalidatePath(`/${existing.repository.ownerId}/${existing.repository.name}/issues`);
    revalidatePath(
      `/${existing.repository.ownerId}/${existing.repository.name}/issues/${existing.number}`
    );

    return { success: true, data: issue as IssueWithRelations };
  } catch (error) {
    console.error("[updateIssue]", error);
    return { success: false, error: "Erro ao atualizar issue" };
  }
}

// ─── closeIssue ───────────────────────────────────────────────────────────────

export async function closeIssue(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Issue não encontrada" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para fechar esta issue" };
    }

    await prisma.issue.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    revalidatePath(`/${existing.repository.ownerId}/${existing.repository.name}/issues`);
    revalidatePath(
      `/${existing.repository.ownerId}/${existing.repository.name}/issues/${existing.number}`
    );

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[closeIssue]", error);
    return { success: false, error: "Erro ao fechar issue" };
  }
}

// ─── reopenIssue ──────────────────────────────────────────────────────────────

export async function reopenIssue(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Issue não encontrada" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para reabrir esta issue" };
    }

    await prisma.issue.update({
      where: { id },
      data: { status: "OPEN" },
    });

    revalidatePath(`/${existing.repository.ownerId}/${existing.repository.name}/issues`);
    revalidatePath(
      `/${existing.repository.ownerId}/${existing.repository.name}/issues/${existing.number}`
    );

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[reopenIssue]", error);
    return { success: false, error: "Erro ao reabrir issue" };
  }
}

// ─── deleteIssue ──────────────────────────────────────────────────────────────

export async function deleteIssue(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Não autorizado" };
    }

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!existing) {
      return { success: false, error: "Issue não encontrada" };
    }
    if (existing.authorId !== session.user.id) {
      return { success: false, error: "Sem permissão para deletar esta issue" };
    }

    await prisma.issue.delete({ where: { id } });

    revalidatePath(`/${existing.repository.ownerId}/${existing.repository.name}/issues`);

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[deleteIssue]", error);
    return { success: false, error: "Erro ao deletar issue" };
  }
}
