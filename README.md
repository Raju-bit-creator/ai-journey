# ai-journey

A personal full-stack AI developer roadmap, tracked in the homepage of this app. Each stage lives in its own folder:

- **`src/`** — Next.js frontend (App Router, React 19, TypeScript). Also the visual progress tracker.
- **`backend/`** — NestJS API: auth (Redis sessions), products (Postgres via TypeORM, ownership, pagination, Redis caching), Swagger docs at `/docs`.
- **`python/`** — standalone FastAPI service serving a scikit-learn classifier.
- **`llm/`** — standalone TypeScript project: RAG, an agent, and an MCP server, all answering questions about / acting on this actual codebase.

## Running it — two ways

### Local dev (what you'd use day to day)

Each service runs on the host with hot reload; only Postgres/Redis run in Docker.

```bash
cd backend && docker compose up -d && npm run start:dev   # NestJS on :3001
npm run dev                                                 # Next.js on :3000 (from repo root)
cd python && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

### Full Docker (the whole stack containerized)

Everything — frontend, backend, Python service, Postgres, Redis — runs in containers, networked together. No local Node/Python setup needed beyond Docker itself.

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (docs at `/docs`)
- Python service: http://localhost:8000

**Don't run both at once** — they'd fight over the same host ports (3000/3001/8000/5433/6380). Stop one (`docker compose down`, in the relevant directory) before starting the other.

**Known simplification:** there's no migration system yet, so the backend auto-syncs its database schema from TypeORM entities on every startup (`DB_SYNCHRONIZE`, defaults on) — including in the containerized "production" build. That's fine for a solo learning project; a real production deployment should replace this with actual migrations before it ever touches a database with data worth keeping.
