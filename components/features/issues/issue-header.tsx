"use client";

import { closeIssue, reopenIssue } from "@/actions/issue.actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { IssueWithRelations } from "@/types";

interface IssueHeaderProps {
  issue: IssueWithRelations & { comments: unknown[] };
  isOwner: boolean;
}

export function IssueHeader({ issue, isOwner }: IssueHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus() {
    startTransition(async () => {
      const action = issue.status === "OPEN" ? closeIssue : reopenIssue;
      const result = await action(issue.id);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-tight">
          {issue.title}{" "}
          <span className="text-muted-foreground font-normal">#{issue.number}</span>
        </h1>

        {isOwner && (
          <Button
            onClick={handleToggleStatus}
            disabled={isPending}
            variant={issue.status === "OPEN" ? "outline" : "default"}
            size="sm"
            className="shrink-0"
          >
            {isPending
              ? "Aguarde..."
              : issue.status === "OPEN"
              ? "Fechar Issue"
              : "Reabrir Issue"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            issue.status === "OPEN"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          }`}
        >
          {issue.status === "OPEN" ? "Aberta" : "Fechada"}
        </span>
        <span>
          Aberta por <strong>{issue.author.name}</strong> ·{" "}
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
            issue.createdAt
          )}
        </span>
      </div>
    </div>
  );
}
