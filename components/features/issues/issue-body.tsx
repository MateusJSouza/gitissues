"use client";

// TODO: Substituir a renderização por um componente Markdown real
// Sugestão: @uiw/react-md-editor com modo preview, ou react-markdown

import type { IssueWithRelations } from "@/types";

interface IssueBodyProps {
  issue: IssueWithRelations & { comments: unknown[] };
  isOwner: boolean;
}

export function IssueBody({ issue }: IssueBodyProps) {
  return (
    <div className="rounded-lg border bg-card">
      {/* Header do card */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          {issue.author.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={issue.author.image}
              alt={issue.author.name ?? ""}
              className="h-6 w-6 rounded-full"
            />
          )}
          <strong>{issue.author.name}</strong>
          <span className="text-muted-foreground">
            comentou em{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(issue.createdAt)}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="prose prose-sm max-w-none p-4 dark:prose-invert">
        {issue.body ? (
          // TODO: renderizar Markdown com react-markdown ou @uiw/react-md-editor preview mode
          <pre className="whitespace-pre-wrap font-sans text-sm">{issue.body}</pre>
        ) : (
          <p className="italic text-muted-foreground">Sem descrição.</p>
        )}
      </div>
    </div>
  );
}
