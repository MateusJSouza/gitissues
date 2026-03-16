import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

// O formulário em si é um Client Component (usa react-hook-form + md-editor)
import { NewIssueForm } from "@/components/features/issues/new-issue-form";

interface NewIssuePageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({ params }: NewIssuePageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `Nova Issue · ${owner}/${repo}`,
  };
}

export default async function NewIssuePage({ params }: NewIssuePageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { owner, repo } = await params;

  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { githubUsername: owner },
    },
    include: {
      labels: true,
    },
  });

  if (!repository) notFound();

  // Só o dono do repositório pode criar issues neste MVP
  if (repository.ownerId !== session.user.id) {
    redirect(`/${owner}/${repo}/issues`);
  }

  const collaborators = await prisma.user.findMany({
    where: { id: repository.ownerId },
    select: { id: true, name: true, image: true, githubUsername: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nova Issue</h1>
        <p className="text-sm text-muted-foreground">
          {owner}/{repo}
        </p>
      </div>

      <NewIssueForm
        repositoryId={repository.id}
        labels={repository.labels}
        collaborators={collaborators}
      />
    </div>
  );
}
