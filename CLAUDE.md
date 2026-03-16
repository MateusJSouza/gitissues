# GitIssues — CLAUDE.md

Clone do sistema de issues do GitHub, construído com Next.js 14 App Router.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict mode, sem `any`) |
| ORM | Prisma 5 |
| Banco | PostgreSQL via Neon (connection pooling + DIRECT_URL) |
| Auth | NextAuth v5 beta — GitHub OAuth + PrismaAdapter |
| UI | Shadcn/ui + Tailwind CSS + lucide-react |
| Formulários | react-hook-form + Zod |
| Markdown | @uiw/react-md-editor |
| Dark mode | next-themes |
| Package manager | **pnpm** |

## Comandos

```bash
pnpm dev           # servidor de desenvolvimento
pnpm build         # build de produção
pnpm lint          # ESLint

pnpm db:generate   # prisma generate (após alterar schema)
pnpm db:migrate    # prisma migrate dev (cria migration e aplica)
pnpm db:push       # prisma db push (sem migration, útil em dev rápido)
pnpm db:studio     # Prisma Studio na porta 5555
```

## Estrutura de pastas

```
gitissues/
├── actions/                  # Server Actions (lógica de negócio)
│   ├── comment.actions.ts
│   ├── issue.actions.ts
│   ├── label.actions.ts
│   └── repository.actions.ts
├── app/
│   ├── (app)/                # Rotas autenticadas
│   │   ├── [owner]/[repo]/issues/
│   │   │   ├── [number]/page.tsx   # Detalhe da issue
│   │   │   ├── new/page.tsx        # Criar issue
│   │   │   └── page.tsx            # Listagem com filtros
│   │   ├── dashboard/page.tsx      # Repositórios do usuário
│   │   └── layout.tsx              # Layout com Header (verifica sessão)
│   ├── (auth)/login/page.tsx       # Login GitHub OAuth
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── health/route.ts         # Keep-alive para Neon (SELECT 1)
│   ├── globals.css
│   └── layout.tsx                  # Root layout (Providers)
├── components/
│   ├── features/
│   │   ├── comments/         # comment-form.tsx, comment-list.tsx
│   │   └── issues/           # issue-body.tsx, issue-header.tsx, new-issue-form.tsx
│   ├── shared/               # header.tsx, theme-toggle.tsx
│   ├── ui/                   # Componentes Shadcn (button.tsx, ...)
│   └── providers.tsx         # SessionProvider + ThemeProvider (Client)
├── lib/
│   ├── auth.ts               # NextAuth config + handlers
│   ├── prisma.ts             # Singleton PrismaClient
│   ├── utils.ts              # cn() helper (clsx + tailwind-merge)
│   └── validations/          # Schemas Zod + tipos inferidos
│       ├── comment.ts
│       ├── issue.ts
│       ├── label.ts
│       ├── repository.ts
│       └── index.ts
├── prisma/schema.prisma      # Schema completo do banco
├── types/index.ts            # Tipos compostos globais
└── middleware.ts             # Proteção de rotas
```

## Convenções obrigatórias

### Componentes
- **Server Components por padrão** — sem `'use client'` a menos que seja necessário (hooks, eventos, estado)
- Dados são buscados diretamente no Server Component com `async/await`, sem `useEffect`
- `'use client'` explícito e justificado: formulários (react-hook-form), toggles de estado, callbacks de browser

### Nomenclatura
- Arquivos: `kebab-case.ts` / `kebab-case.tsx`
- Componentes React: `PascalCase`
- Server Actions: sufixo `.actions.ts`
- Variáveis de ambiente: `SCREAMING_SNAKE_CASE`

### TypeScript
- `strict: true` — sem `any`, sem `@ts-ignore` sem justificativa
- Tipos de retorno explícitos em Server Actions
- Types exportados junto dos schemas Zod via `z.infer<typeof schema>`

### Server Actions
Todo action segue este contrato:

```ts
export async function minhaAction(input: MeuInput): Promise<ActionResult<MeuRetorno>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autorizado" };

    const parsed = meuSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    // lógica...
    revalidatePath("/rota/afetada");
    return { success: true, data: resultado };
  } catch (error) {
    console.error("[minhaAction]", error);
    return { success: false, error: "Mensagem amigável" };
  }
}
```

O tipo `ActionResult<T>` está em `types/index.ts`:
```ts
type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Prisma
- Sempre usar `select` ou `include` explícitos — nunca retornar o modelo inteiro desnecessariamente
- Após qualquer escrita, chamar `revalidatePath()` com as rotas afetadas
- Rodar `pnpm db:generate` após qualquer alteração no `schema.prisma`

### Shadcn/ui
- Adicionar novos componentes via CLI: `pnpm dlx shadcn@latest add <componente>`
- Os componentes ficam em `components/ui/`
- Dependências base já instaladas: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`

## Variáveis de ambiente

Todas documentadas em `.env.example`. As obrigatórias:

```
DATABASE_URL        # Neon pooled (pgbouncer=true)
DIRECT_URL          # Neon direct (usado pelo Prisma Migrate)
AUTH_SECRET         # openssl rand -base64 32
AUTH_GITHUB_ID      # GitHub OAuth App Client ID
AUTH_GITHUB_SECRET  # GitHub OAuth App Client Secret
```

## Banco de dados

### Models principais
- `User` — usuário autenticado via GitHub
- `Repository` — repositório de issues (único por `ownerId + name`)
- `Issue` — issue com status `OPEN | CLOSED`, número sequencial por repositório
- `Label` — label colorida por repositório
- `Comment` — comentário em issue
- `Account`, `Session`, `VerificationToken` — exigidos pelo NextAuth

### Índices relevantes
- `Issue`: `(repositoryId)`, `(status)`, `(repositoryId, status)` — queries de listagem
- `Issue`: `@@unique([repositoryId, number])` — garante número único por repo
- `Repository`: `@@unique([ownerId, name])` — garante nome único por usuário

## Rota de health check

`GET /api/health` executa `SELECT 1` via Prisma e retorna `{ status, timestamp }`.
Deve ser chamada por um cron job externo (ex: cron-job.org) a cada ~5 minutos para evitar que o banco Neon entre em modo de suspensão.

## Middleware

Protege todas as rotas exceto:
- `/login`
- `/api/auth/**`
- `/api/health`

Redireciona para `/login?callbackUrl=<rota-original>` quando não autenticado.

## TODOs conhecidos

- [ ] Substituir `<textarea>` por `@uiw/react-md-editor` em `new-issue-form.tsx` e `comment-form.tsx`
- [ ] Adicionar toasts de feedback (Shadcn `sonner`)
- [ ] Criar página `/repositories/new` com form de criação de repositório
- [ ] Implementar filtros de busca na listagem de issues (label, assignee, texto)
- [ ] Adicionar paginação na listagem de issues
- [ ] Adicionar mais componentes Shadcn via CLI conforme necessário
