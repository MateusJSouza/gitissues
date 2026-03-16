"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIssueSchema, type CreateIssueInput } from "@/lib/validations";
import { createIssue } from "@/actions/issue.actions";
import { Button } from "@/components/ui/button";
import type { Label, User } from "@prisma/client";

interface NewIssueFormProps {
  repositoryId: string;
  labels: Label[];
  collaborators: Pick<User, "id" | "name" | "image" | "githubUsername">[];
}

export function NewIssueForm({ repositoryId, labels, collaborators }: NewIssueFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateIssueInput>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: { repositoryId, labelIds: [] },
  });

  async function onSubmit(data: CreateIssueInput) {
    const result = await createIssue(data);
    if (result.success) {
      router.back();
      router.refresh();
    } else {
      // TODO: exibir toast de erro
      console.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("repositoryId")} />

      {/* Título */}
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">
          Título <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="Título da issue"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Corpo (Markdown) — TODO: substituir textarea por @uiw/react-md-editor */}
      <div className="space-y-1">
        <label htmlFor="body" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="body"
          {...register("body")}
          rows={10}
          placeholder="Descreva a issue em Markdown..."
          className="flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Labels</label>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <label key={label.id} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" value={label.id} {...register("labelIds")} />
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                    border: `1px solid ${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Assignee */}
      {collaborators.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="assigneeId" className="text-sm font-medium">
            Assignee
          </label>
          <select
            id="assigneeId"
            {...register("assigneeId")}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Nenhum</option>
            {collaborators.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.githubUsername}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar Issue"}
        </Button>
      </div>
    </form>
  );
}
