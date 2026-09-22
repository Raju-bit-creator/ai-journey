# Testing

The backend uses Vitest, not Jest. This is because it was scaffolded with ESM (ECMAScript Modules, `"type": "module"` in `package.json`) rather than CommonJS — the NestJS CLI pairs ESM projects with Vitest and CommonJS projects with Jest by default. Vitest's API is nearly identical to Jest's (`describe`, `it`, `expect`, `vi.fn()` instead of `jest.fn()`).

There are two separate test types, run with separate configs and separate npm scripts:

- Unit tests (`*.spec.ts`, run via `npm test`) mock out dependencies like the database repository and the Redis client, so they run in well under a second and test one class's logic in isolation. Example: `products.service.spec.ts` verifies that `update()` throws `ForbiddenException` when called with a user id that doesn't match the product's owner, using a fake in-memory repository.
- End-to-end tests (`*.e2e-spec.ts`, run via `npm run test:e2e`) boot the real NestJS application and make real HTTP requests against it via `supertest`, hitting the actual Postgres and Redis containers. They register real users, create real products, and assert on real HTTP status codes — e.g. that a second user genuinely gets a 403 when trying to edit the first user's product. E2E tests clean up all the data they create in an `afterAll` hook.

The Python service has its own separate pytest suite (`python/tests/test_predict.py`), using FastAPI's `TestClient`.
