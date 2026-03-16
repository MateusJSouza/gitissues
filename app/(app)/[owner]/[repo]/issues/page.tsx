import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { IssueStatus } from "@prisma/client";
import type { Metadata } from "next";

interface IssuesPageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ status?: string; label?: string; assignee?: string; q?: string }>;
}

export async function generateMetadata({ params }: IssuesPageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `Issues · ${owner}/${repo}`,
  };
}

export default async function IssuesPage({ params, searchParams }: IssuesPageProps) {
  const { owner, repo } = await params;
  const filters = await searchParams;

  // Resolve o repositório via githubUsername do owner
  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { githubUsername: owner },
    },
    include: {
      owner: { select: { id: true, name: true, githubUsername: true } },
      labels: true,
    },
  });

  if (!repository) notFound();

  const status: IssueStatus =
    filters.status === "CLOSED" ? "CLOSED" : "OPEN";

  const issues = await prisma.issue.findMany({
    where: {
      repositoryId: repository.id,
      status,
      ...(filters.label && {
        labels: { some: { name: filters.label } },
      }),
      ...(filters.assignee && {
        assignee: { githubUsername: filters.assignee },
      }),
      ...(filters.q && {
        title: { contains: filters.q, mode: "insensitive" },
      }),
    },
    include: {
      author: { select: { id: true, name: true, image: true, githubUsername: true } },
      assignee: { select: { id: true, name: true, image: true, githubUsername: true } },
      labels: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [openCount, closedCount] = await Promise.all([
    prisma.issue.count({ where: { repositoryId: repository.id, status: "OPEN" } }),
    prisma.issue.count({ where: { repositoryId: repository.id, status: "CLOSED" } }),
  ]);

  const basePath = `/${owner}/${repo}/issues`;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {owner}/{repo}
        </h1>
        <Link
          href={`${basePath}/new`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nova Issue
        </Link>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-4 border-b pb-3">
        <Link
          href={`${basePath}?status=OPEN`}
          className={`text-sm font-medium ${status === "OPEN" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {openCount} Abertas
        </Link>
        <Link
          href={`${basePath}?status=CLOSED`}
          className={`text-sm font-medium ${status === "CLOSED" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {closedCount} Fechadas
        </Link>
      </div>

      {/* Lista de issues */}
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">
            Nenhuma issue {status === "OPEN" ? "aberta" : "fechada"}
          </h3>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`${basePath}/${issue.number}`}
                className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {issue.title}
                    </span>
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
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    #{issue.number} aberta por {issue.author.name} ·{" "}
                    {issue._count.comments} comentário
                    {issue._count.comments !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
