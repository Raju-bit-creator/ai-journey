# Authentication and sessions

The backend uses session-based authentication, not JWT. Sessions are stored server-side in Redis, not Postgres.

Flow: a user registers or logs in via `POST /auth/register` or `POST /auth/login`. The backend hashes passwords with bcrypt, verifies credentials against the `user` table in Postgres, and on success generates a random UUID as the session id. It stores `session:<uuid> -> userId` in Redis with a 7-day TTL (`SET session:<uuid> <userId> EX 604800`), and returns `{ sessionId, user }` as plain JSON — not as a cookie.

Because the Next.js frontend calls the NestJS backend server-to-server (via Server Actions), the frontend sets its own httpOnly cookie named `sid` on its own origin, containing that session id. On every subsequent request, the frontend reads the `sid` cookie and forwards it to the backend as a plain `x-session-id` header. The backend's `SessionAuthGuard` reads that header, looks up `session:<id>` in Redis, and either attaches the user to the request or throws `UnauthorizedException` (401).

Logout (`POST /auth/logout`) simply calls `redis.del('session:' + id)`. Because the session's existence is checked on every request via a Redis lookup, deleting the key invalidates that session instantly and permanently — unlike a JWT, which stays valid until it expires unless a separate revocation list is maintained.

`GET /auth/me` returns the current user given a valid `x-session-id` header.
