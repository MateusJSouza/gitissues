import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas — acessíveis sem autenticação
const PUBLIC_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/api/auth", "/api/health"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  // Permite rotas públicas sem checar sessão
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Redireciona para login se não autenticado
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Aplica o middleware a todas as rotas exceto estáticos e _next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
