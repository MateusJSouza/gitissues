"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCommentSchema, type CreateCommentInput } from "@/lib/validations";
import { createComment } from "@/actions/comment.actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CommentFormProps {
  issueId: string;
}

export function CommentForm({ issueId }: CommentFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { issueId },
  });

  async function onSubmit(data: CreateCommentInput) {
    const result = await createComment(data);
    if (result.success) {
      reset();
      router.refresh();
    } else {
      // TODO: toast de erro
      console.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-medium">Adicionar comentário</h3>
      </div>

      <div className="p-4 space-y-3">
        <input type="hidden" {...register("issueId")} />

        {/* TODO: substituir por @uiw/react-md-editor */}
        <textarea
          {...register("body")}
          rows={5}
          placeholder="Escreva um comentário em Markdown..."
          className="flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
        {errors.body && (
          <p className="text-xs text-destructive">{errors.body.message}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
