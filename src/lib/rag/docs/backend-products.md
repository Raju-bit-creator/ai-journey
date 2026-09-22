# Products: ownership, pagination, and caching

The `Product` entity in `backend/src/products/product.entity.ts` has a nullable `owner` relation to `User`. Products created before authentication existed have `owner: null` and are treated as "unowned" — anyone logged in can edit or delete them. Products created after a user is logged in are tied to that user via `ownerId`.

Ownership is enforced in `ProductsService`, not just hidden in the UI: `update()` and `remove()` both call `assertOwnership()`, which throws a `ForbiddenException` (HTTP 403) if the product has an owner and the calling user's id doesn't match. `POST`, `PATCH`, and `DELETE /products` all require a valid session via `SessionAuthGuard`. `GET /products` and `GET /products/:id` are public and require no authentication.

`GET /products` is paginated: `?page=1&limit=10` (default), returning `{ items, total, page, limit, totalPages }`. Results are cached in Redis per page (`products:page:<page>:<limit>`) for 15 seconds. Any create, update, or delete invalidates the entire cache by scanning and deleting all `products:page:*` keys, so writes are always immediately visible.

The `price` column uses a TypeORM transformer to convert Postgres's `numeric` type (which node-postgres returns as a string by default) back into a JavaScript number.
