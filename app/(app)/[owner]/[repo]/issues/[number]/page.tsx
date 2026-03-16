import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Sub-componentes Client (formulário de comentário, ações de fechar/reabrir)
import { IssueHeader } from "@/components/features/issues/issue-header";
import { IssueBody } from "@/components/features/issues/issue-body";
import { CommentList } from "@/components/features/comments/comment-list";
import { CommentForm } from "@/components/features/comments/comment-form";

interface IssueDetailPageProps {
  params: Promise<{ owner: string; repo: string; number: string }>;
}

export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
  const { owner, repo, number } = await params;
  const issueNumber = parseInt(number, 10);
  if (isNaN(issueNumber)) return { title: "Issue não encontrada" };

  const issue = await prisma.issue.findFirst({
    where: {
      number: issueNumber,
      repository: { name: repo, owner: { githubUsername: owner } },
    },
    select: { title: true },
  });

  return {
    title: issue ? `${issue.title} · ${owner}/${repo}` : "Issue não encontrada",
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const session = await auth();
  const { owner, repo, number } = await params;

  const issueNumber = parseInt(number, 10);
  if (isNaN(issueNumber)) notFound();

  const issue = await prisma.issue.findFirst({
    where: {
      number: issueNumber,
      repository: { name: repo, owner: { githubUsername: owner } },
    },
    include: {
      author: { select: { id: true, name: true, image: true, githubUsername: true } },
      assignee: { select: { id: true, name: true, image: true, githubUsername: true } },
      repository: { select: { id: true, name: true } },
      labels: true,
      _count: { select: { comments: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true, githubUsername: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) notFound();

  const isOwner = session?.user?.id === issue.authorId;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Título e metadados da issue */}
      <IssueHeader issue={issue} isOwner={isOwner} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        {/* Coluna principal: corpo + comentários */}
        <div className="space-y-4">
          <IssueBody issue={issue} isOwner={isOwner} />
          <CommentList comments={issue.comments} currentUserId={session?.user?.id} />

          {/* Formulário de novo comentário (requer autenticação) */}
          {session?.user && <CommentForm issueId={issue.id} />}
        </div>

        {/* Sidebar: assignee, labels */}
        <aside className="space-y-4">
          <div className="rounded-lg border p-4 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Assignees
            </h3>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                {issue.assignee.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={issue.assignee.image}
                    alt={issue.assignee.name ?? ""}
                    className="h-5 w-5 rounded-full"
                  />
                )}
                <span>{issue.assignee.name}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum assignee</p>
            )}
          </div>

          <div className="rounded-lg border p-4 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Labels
            </h3>
            {issue.labels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {issue.labels.map((label) => (
                  <span
                    key={label.id}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma label</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
