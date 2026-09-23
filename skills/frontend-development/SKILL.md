---
name: frontend-development
description: Use when writing or changing anything in the Next.js frontend — src/, next.config.ts, the root package.json — including pages, Server Actions, client components, src/lib/auth, src/lib/agent, and src/lib/rag. Covers this app's server-first conventions, session forwarding, Gemini usage, and known gotchas.
---

# Frontend development (Next.js 16, App Router)

**Read the bundled docs first.** This Next.js version differs from training data (see `AGENTS.md`). Before using an API, look in `node_modules/next/dist/docs/` — e.g. `01-app/02-guides/forms.md`, `01-app/03-api-reference/04-functions/cookies.md`.

## Architecture: server first

- Pages and layouts are **Server Components**. Fetch on the server: `fetch(`${process.env.BACKEND_URL}/...`, { cache: 'no-store' })`.
- Mutations are **Server Actions** (`'use server'`), followed by `revalidatePath('/products')`. `redirect()` throws — call it **last**, never inside a try/catch.
- Client components (`'use client'`) only where interactivity is needed. Forms use `useActionState(action, initialState)`; the action signature is `(prevState, formData)`; pass extra arguments with `action.bind(null, id)`.
- The browser **never** calls NestJS or FastAPI directly. `BACKEND_URL`, `PYTHON_URL`, `GEMINI_API_KEY` are server-only — never prefix them with `NEXT_PUBLIC_`.
- Next 16 async APIs: `params` and `searchParams` are Promises (`const { id } = await params`); `cookies()` is async (`(await cookies()).get(...)`).
- Server Actions are public HTTP endpoints. Validate input and check auth **inside every action** — hiding a button is not authorization.

## Auth (reuse, don't reinvent)

- `src/lib/auth.ts`: `getSessionHeader()` → `{ 'x-session-id': <sid cookie> }`; `getCurrentUser()` → calls backend `/auth/me`.
- Login/register actions call Nest, get `{ sessionId }` back in JSON, and **Next** sets its own httpOnly `sid` cookie (7 days). Nest never sets browser cookies.
- For protected backend calls, spread `...(await getSessionHeader())` into the fetch headers.
- UI gating (hiding Edit/Delete for non-owners) is convenience only. The backend enforces ownership.

## Conventions

- **Imports:** `moduleResolution: bundler` → relative imports have **no** `.js` extension. Alias `@/*` → `src/*`. `backend/`, `python/`, `llm/` are excluded from the root tsconfig and ESLint — never import from them.
- **Styling:** Tailwind v4, zinc palette, always with `dark:` variants. Page shell: `flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black` wrapping `<main className="flex w-full max-w-3xl ...">`. Borders: `border-black/[.08] dark:border-white/[.145]`. Reuse the field/button classes in `src/app/products/product-form.tsx`.
- **JSX text:** apostrophes and quotes must be `&apos;` / `&ldquo;` — `react/no-unescaped-entities` fails lint.
- **New route:** a folder with `page.tsx`, plus `actions.ts` and client `*.tsx` as needed. Backend response types are declared locally next to where they're used.
- **Keep `output: 'standalone'`** in `next.config.ts` — the Docker image depends on it.

## LLM features (`src/lib/agent`, `src/lib/rag`)

- Model is `gemini-3.6-flash` via `@google/genai`. Use `ai.models.generateContent(...)`. **Do not use `ai.interactions.*`** — it hangs forever on this key.
- **Agent loop:** push `response.candidates[0].content` (the raw content) into history. Rebuilding function-call parts drops `thoughtSignature` and the next request fails with a 400.
- **Adding a tool (3 steps):** declaration + `execute` in `src/lib/agent/tools/<category>.ts` → register in the `tools` map in `agent.ts` → mention it in the system instruction. The chat UI renders tool calls generically; no UI change needed.
- **Tool arguments come from the model — treat them as untrusted.** Validate them, and `encodeURIComponent` anything interpolated into a URL path.
- **Quota:** free tier is 20 requests/day. `generateContentWithRetry` retries 429/503 with backoff, and both `runAgent` and `ask` return a friendly fallback instead of throwing. Preserve that behavior.
- **RAG:** docs in `src/lib/rag/docs/*.md` → `npm run rag:ingest` writes `src/lib/rag/vector-store.json` (gitignored). User questions are never written to it; embeddings are local (`@huggingface/transformers`). Re-ingest after editing any doc.
- System prompts are product decisions: the agent may fall back to general knowledge, while RAG must refuse when its context lacks the answer. Change them deliberately.

## Done checklist

`npx tsc --noEmit` · `npm run lint` · restart `npm run dev` if `.env.local` changed · for UI changes, exercise the page in a real browser (see the `testing` skill) · update `README.md` / RAG docs if behavior described there changed.
