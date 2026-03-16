import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

// Layout protegido — aplica-se a todas as rotas dentro de (app)/
export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
