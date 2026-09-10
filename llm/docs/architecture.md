# Project architecture

ai-journey is a personal learning project tracking progress through a full-stack AI developer roadmap: Frontend, Backend, Python, LLM Engineering, and Production AI.

The repo is a monorepo-by-folder, not a formal workspace:

- `src/` — the Next.js 16 frontend (App Router, React 19, TypeScript, Tailwind). The homepage is a visual progress tracker for the roadmap.
- `backend/` — a standalone NestJS backend with PostgreSQL (via TypeORM) and Redis.
- `python/` — a standalone FastAPI service serving a scikit-learn ML model, not wired into the rest of the stack.
- `llm/` — a standalone TypeScript project for LLM Engineering work (RAG, agents, MCP). Retrieval uses a local embedding model (`@huggingface/transformers`, no API key needed); generation calls the Gemini API.

Each stage's code is intentionally kept separate. The frontend talks to the backend over HTTP; the backend runs its own PostgreSQL and Redis in Docker containers (`backend/docker-compose.yml`), mapped to non-default host ports (5433 for Postgres, 6380 for Redis) to avoid colliding with other local services on the same machine.
