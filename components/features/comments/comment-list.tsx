import type { CommentWithAuthor } from "@/types";

interface CommentListProps {
  comments: CommentWithAuthor[];
  currentUserId?: string;
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) return null;

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border bg-card">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm">
            {comment.author.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.author.image}
                alt={comment.author.name ?? ""}
                className="h-6 w-6 rounded-full"
              />
            )}
            <strong>{comment.author.name}</strong>
            <span className="text-muted-foreground">
              comentou em{" "}
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                comment.createdAt
              )}
            </span>
          </div>

          {/* Corpo */}
          <div className="p-4 text-sm">
            {/* TODO: renderizar Markdown */}
            <pre className="whitespace-pre-wrap font-sans">{comment.body}</pre>
          </div>
        </li>
      ))}
    </ul>
  );
}
