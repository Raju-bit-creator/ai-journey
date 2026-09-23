---
name: backend-development
description: Use when writing or changing anything in backend/ — NestJS modules, controllers, services, DTOs, TypeORM entities, Redis usage, auth/sessions, Swagger, Dockerfile, or backend env. Covers this project's ESM setup, layering, session auth, ownership checks, cache invalidation, and schema-sync caveats.
---

# Backend development (NestJS 12, TypeORM/Postgres, Redis)

## Setup facts that bite

- **ESM / NodeNext** (`"type": "module"`): every relative import ends in `.js` (`import { X } from './x.service.js'`) even though the file is `.ts`. Named imports for CJS packages: `import { Redis } from 'ioredis'`, `import * as bcrypt from 'bcryptjs'`.
- Ports: Postgres host **5433**, Redis host **6380** (defaults are taken by other services on this machine). Backend listens on **3001** (`PORT`). Inside Docker the containers use service names and internal ports (`postgres:5432`, `redis:6379`).
- Env (`backend/.env`, documented in `.env.example`): `PORT`, `DATABASE_URL`, `REDIS_URL`, `DB_SYNCHRONIZE`. Read once at boot — restart after changes. `nest start --watch` does **not** reliably reload env or pick up every change; when in doubt, fully restart.

## Layering

`Module → Controller (thin, HTTP only) → Service (all logic) → TypeORM repository`.

- Validate input with DTOs (`class-validator`). The global `ValidationPipe({ whitelist: true, transform: true })` lives in `main.ts`; use `@Type(() => Number)` for numeric query params. Update DTOs via `PartialType(CreateXDto)` from `@nestjs/mapped-types`.
- Throw Nest exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`, `UnauthorizedException`) from services; never return error-shaped 200s.
- Register new modules in `AppModule`. Entities register through `TypeOrmModule.forFeature([...])` (`autoLoadEntities` is on).

## Data layer

- **There is no migration system.** `synchronize` is `DB_SYNCHRONIZE !== 'false'` (on by default, including in production containers). Any entity change auto-applies on next boot. Adding a NOT NULL column to a populated table fails — make it nullable or give it a default. Flag destructive changes to the user before making them. Setting `NODE_ENV=production` does *not* disable sync.
- `User.passwordHash` is `select: false`; fetch it only through `UsersService.findByEmailWithPassword`. Never return it.
- `Product.price` is `numeric` with a transformer (Postgres returns numeric as string) — keep the transformer.
- `Product.owner` is a nullable eager `ManyToOne(User)`. Legacy rows have `owner: null` and are editable by any logged-in user.

## Auth & authorization

- Sessions are Redis keys `session:<uuid>` → `userId`, TTL 7 days. Login/register return `{ sessionId, user }` in JSON (no cookies). Logout deletes the key — revocation is instant.
- Protect routes with `@UseGuards(SessionAuthGuard)` (reads the `x-session-id` header) and get the caller with `@CurrentUser()`.
- **Enforce ownership in the service**, not just the UI: `assertOwnership(product, userId)` → `ForbiddenException`. Every new write path on an owned resource needs it, plus a test.
- Read endpoints (`GET /products`, `GET /products/:id`) are public by design.

## Redis caching

- Product list cache keys: `products:page:<page>:<limit>`, TTL 15s.
- **Every write path must call `invalidateCache()`** (create, update, delete, and any new one). A new cached read needs invalidation on *all* writes that affect it.

## API docs

- Swagger at `/docs`. The `@nestjs/swagger` CLI plugin (`nest-cli.json`) infers DTO schemas — no manual `@ApiProperty`. Add `@ApiTags(...)` on controllers and `@ApiHeader({ name: 'x-session-id', required: true })` on guarded routes.

## Adding a resource — checklist

entity → DTOs (create + `PartialType` update) → service (logic, ownership, cache invalidation) → controller (guards, `@ApiTags`) → module → register in `AppModule` → unit tests (mocked repo/Redis) → e2e test (real Postgres/Redis, cleans up after itself) → update the frontend/`llm` docs if the API contract changed.

## Done checklist

`npm run build` · `npm run lint` · `npm test` · `npm run test:e2e` (needs `docker compose up -d` in `backend/`) · restart the running server and hit a **real data endpoint** with curl — `/health` only proves connectivity, not schema. Docker changes: rebuild the image and exercise `/products`, not just `/health`.
