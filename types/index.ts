import type { User, Repository, Issue, Label, Comment, IssueStatus } from "@prisma/client";

// ─── Re-exports dos tipos Prisma ──────────────────────────────────────────────
export type { User, Repository, Issue, Label, Comment, IssueStatus };

// ─── Tipos compostos para uso nas páginas e componentes ───────────────────────

export type IssueWithRelations = Issue & {
  author: Pick<User, "id" | "name" | "image" | "githubUsername">;
  assignee: Pick<User, "id" | "name" | "image" | "githubUsername"> | null;
  repository: Pick<Repository, "id" | "name">;
  labels: Label[];
  _count: { comments: number };
};

export type IssueDetail = IssueWithRelations & {
  comments: CommentWithAuthor[];
};

export type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "name" | "image" | "githubUsername">;
};

export type RepositoryWithOwner = Repository & {
  owner: Pick<User, "id" | "name" | "image" | "githubUsername">;
  _count: { issues: number };
};

// ─── Server Action Response ────────────────────────────────────────────────────

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Filter types ─────────────────────────────────────────────────────────────

export type IssueFilters = {
  status?: IssueStatus;
  labelId?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
};
