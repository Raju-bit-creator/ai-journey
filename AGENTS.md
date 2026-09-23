<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ai-journey — working agreement

A personal full-stack AI roadmap (Frontend → Backend → Python/ML → LLM Engineering → Production AI), built as separate projects in one repo. The homepage (`src/app/page.tsx`) is the roadmap tracker — update its `stages` array when a stage's status changes.

## Repo map

| Path | What it is | Port |
|---|---|---|
| `src/` (repo root) | Next.js 16 App Router frontend, incl. `/assistant` (tool-using agent) and `/docs-assistant` (RAG) | 3000 |
| `backend/` | NestJS 12 API: auth (Redis sessions), products (Postgres via TypeORM), Swagger at `/docs` | 3001 |
| `python/` | FastAPI + scikit-learn Iris classifier (`/predict`) | 8000 |
| `llm/` | Standalone TS sandbox: RAG, agent CLI, MCP server. **Not imported by the app** — `src/lib/agent` and `src/lib/rag` are deliberate copies | — |
| Postgres / Redis | Docker via `backend/docker-compose.yml`, host ports **5433** / **6380** (not the defaults — native services on this machine own 5432/6379) | 5433 / 6380 |

Each project has its own `package.json`/toolchain and no shared code. The frontend talks to Nest and FastAPI over HTTP, **server-side only**.

## Commands

| Project | Run | Verify |
|---|---|---|
| Frontend (repo root) | `npm run dev` | `npx tsc --noEmit` · `npm run lint` · `npm run build` |
| Backend | `cd backend && docker compose up -d && npm run start:dev` | `npm run build` · `npm run lint` · `npm test` · `npm run test:e2e` |
| Python | `cd python && source venv/bin/activate && uvicorn app.main:app --reload --port 8000` | `pytest -v` (needs `python train.py` once) |
| LLM sandbox | `cd llm && npm run ingest \| ask \| agent \| mcp` | `npx tsc --noEmit` |
| RAG index (frontend) | `npm run rag:ingest` | — |

`docker compose up -d --build` at the repo root runs the *whole* stack in containers. It uses the same host ports as local dev — **never run both at once**.

## Rules that apply everywhere

1. **Secrets.** `.env*` files are gitignored and hold real values (including a Gemini API key in `.env.local` and `llm/.env`). Never copy them into docs, tests, commits, or chat output. Document new variables in the relevant `.env.example`.
2. **Env vars load once, at process start.** After editing any `.env*`, restart the server. Editor-managed dev servers are often stale — check with `ps eww -p <pid> | tr ' ' '\n' | grep VAR`.
3. **Verify by running, not by building.** A green typecheck is not verification. Exercise the real path. `/health` only proves connectivity, not that the schema exists.
4. **Before saying "done":** typecheck + lint + tests for every project you touched (table above).
5. **Don't commit or push unless asked.** Keep diffs scoped to the request.
6. **Check ports before assuming they're free:** `lsof -iTCP:<port> -sTCP:LISTEN -P`.
7. **Gemini free tier is 20 requests/day per model.** A 429 looks like a hang. Don't burn the quota on repeated test runs — test retrieval and tool logic without calling the model.
8. **Keep docs truthful.** If behavior described in `src/lib/rag/docs/*.md` or `llm/docs/*.md` changes, edit them and re-run the matching ingest.

## Skills

Task-specific playbooks live in `skills/<name>/SKILL.md`. Read the relevant one **before** starting that kind of work.

| Skill | Read it when… |
|---|---|
| [`frontend-development`](skills/frontend-development/SKILL.md) | changing anything in the Next.js app (`src/`, `next.config.ts`) |
| [`backend-development`](skills/backend-development/SKILL.md) | changing anything in `backend/` (NestJS, TypeORM, Redis, auth) |
| [`testing`](skills/testing/SKILL.md) | writing or running tests, or verifying a change end to end |
| [`code-review`](skills/code-review/SKILL.md) | reviewing a diff, PR, or your own changes before finishing |
