import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Seus repositórios",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const repositories = await prisma.repository.findMany({
    where: { ownerId: session.user.id },
    include: {
      owner: {
        select: { id: true, name: true, image: true, githubUsername: true },
      },
      _count: { select: { issues: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seus Repositórios</h1>
          <p className="text-sm text-muted-foreground">
            {repositories.length} {repositories.length === 1 ? "repositório" : "repositórios"}
          </p>
        </div>

        {/* TODO: Abrir modal/form de criação de repositório */}
        <Link
          href="/repositories/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Novo Repositório
        </Link>
      </div>

      {repositories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">Nenhum repositório ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie seu primeiro repositório para começar a gerenciar issues.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <Link
              key={repo.id}
              href={`/${repo.owner.githubUsername ?? repo.ownerId}/${repo.name}/issues`}
              className="block rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-foreground">{repo.name}</h2>
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {repo._count.issues} issues
                </span>
              </div>
              {repo.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {repo.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Criado em{" "}
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(repo.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
