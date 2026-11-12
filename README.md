# Blueberry HMS

Front-desk system for one property. Staff sign in, find or add a guest, quote a specific room, confirm the stay, and record money received at the desk.

**Status:** Front-desk ledger is running. Guest register, invoices, housekeeping board, and reports are not built yet.  
**Last updated:** 9 November 2026 (Melbourne)

The API is NestJS (`apps/api-core`, prefix `/api/v1`). The staff UI is React and Vite (`apps/admin-panel`). PostgreSQL is the store. Redis and Keycloak are present in Docker Compose and are not used by the API.

## What is running

| Area | Status |
| --- | --- |
| Sign-in, roles, and staff accounts | Running on the API. The admin panel has sign-in and sign-out. |
| Guests | Search and create on the API and in the admin panel. |
| Rooms | Inventory, rack rate, and housekeeping status. Check-in and checkout own occupancy. |
| Bookings | Server quote, create, schedule change, check-in, checkout, cancel, and no-show. |
| Ledger | Append-only receipts and reversals. The desk records money received. |
| Property settings | Owner-only API. No admin screen yet. |
| Dashboard | Shell only. No occupancy or revenue figures. |
| Guest register, GST invoice, reports | Not started. |

## Money

Amounts are integer paise. One rupee is 100 paise. The server reads the room rack rate, counts nights, and applies tax from `TAX_ROOM_BASIS_POINTS` (100 basis points = 1%). A manager may apply a discount up to `MAX_DISCOUNT_BASIS_POINTS`, with a reason. The client cannot send a price, a booking status, or a payment status.

A receipt is written inside a transaction that locks the booking row. The same `Idempotency-Key` does not post twice. The paid amount cannot pass the stay total. Checkout is refused while a balance is still due. A reversal corrects one receipt in full. It does not send money to a guest, a bank, or a gateway.

A database or process can still stop. A receipt is not half-written, and a balance is not computed from a floating-point number.

## Security

- Required settings come from the environment. The API refuses to boot when a required value is missing or is a known placeholder. See `.env.example`.
- New passwords are hashed with bcrypt (12 rounds).
- The session cookie is `bh_access` (`HttpOnly`, `SameSite=Strict`, path `/api/v1`). Production marks it `Secure`.
- Browser mutations send `x-csrf-token`. The login and `/auth/me` responses return that token. They do not return the access token.
- Login answers `Invalid credentials` for an unknown account and a wrong password. Login is limited to 5 attempts a minute. Other routes default to 120 a minute.
- Public registration stays off unless `ALLOW_PUBLIC_REGISTER=true`, and it stays off in production. A public registration can only create a `GUEST`. An owner creates staff. Only a super admin can grant `SUPER_ADMIN`.
- Guest search is `POST /guests/search` with the query in the body.
- Logs keep ids, amounts, and counts. They omit names, emails, phones, notes, and full payment references.
- `DB_SYNCHRONIZE=true` is refused in production.
- Swagger at `/api/docs` is available only when `NODE_ENV` is not production.
- Docker publishes Postgres, Redis, Keycloak, and PgAdmin on `127.0.0.1`. Redis requires `REDIS_PASSWORD`.
- The admin panel reads `VITE_API_URL` and keeps the session in memory. It does not store a token in `localStorage`.

In production the admin panel and the API must share a site the browser treats as same-site, or the session cookie will not be sent.

### Roles

A route allows the named role and every role above it.

| Role | Level | What it can reach |
| --- | --- | --- |
| `SUPER_ADMIN` | 100 | Everything below, and it can grant `SUPER_ADMIN`. |
| `OWNER` | 90 | Staff accounts and property settings. |
| `MANAGER` | 70 | Rooms create and edit, payment reversals, discounts, user list. |
| `FRONT_DESK` | 50 | Guests, quotes, bookings, check-in, checkout, receipts. |
| `HOUSEKEEPING` | 30 | Room list and manual status, except occupancy. |
| `KITCHEN` | 30 | Same floor as housekeeping. No kitchen module yet. |
| `MAINTENANCE` | 30 | Same floor as housekeeping. |
| `GUEST` | 10 | No staff routes. |

## Setup

Requirements: Node.js 18+, pnpm 8+, and Docker with Compose when you want PostgreSQL from this repo.

```bash
pnpm install
cp .env.example .env
cp apps/admin-panel/.env.example apps/admin-panel/.env
```

Fill every blank in `.env`. `DB_PASSWORD` is at least 12 characters. `JWT_SECRET` is at least 32 characters and is not a placeholder. `JWT_EXPIRES_IN` is at most 16 hours in production. `CORS_ORIGINS` is an explicit list. `PROPERTY_TIMEZONE` is an IANA name. `TAX_ROOM_BASIS_POINTS` and `MAX_DISCOUNT_BASIS_POINTS` are integers from 0 to 10000.

Set `VITE_API_URL` in `apps/admin-panel/.env` to the API origin with no path, for example `http://127.0.0.1:4000`.

```bash
pnpm run docker:up
```

A new development database can be created by setting `DB_SYNCHRONIZE=true` for one boot, then setting it back to `false`. Production stays on `false`. An existing database that already has `bookings` and `payments` picks up the ledger columns with:

```bash
pnpm --filter @blueberry/api-core run migration:run
```

That migration alters those tables. It does not create the whole schema on an empty database.

The seed is off until `SEED_ENABLED=true`. It creates one super admin from `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FIRST_NAME`, and `SEED_ADMIN_LAST_NAME`, and it inserts six rooms when the rooms table is empty. It does not insert guests.

```bash
pnpm --filter @blueberry/api-core run seed
pnpm run dev
```

- API health: `GET /api/v1/health` on `API_PORT` (4000 unless you change it)
- Swagger: `/api/docs` on that same port
- Admin panel: port 5173

## API the desk uses

Browser calls send the session cookie. Mutations also send `x-csrf-token`. Amounts in JSON are decimal strings.

| Method and path | Who | Purpose |
| --- | --- | --- |
| `POST /auth/login` | Public | Sets `bh_access` and returns `{ user, csrfToken }`. |
| `POST /auth/logout` | Signed in | Clears the cookie. |
| `GET /auth/me` | Signed in | Returns the user and a fresh CSRF token. |
| `POST /users` | Owner | Creates a staff account. |
| `POST /guests` | Front desk | Creates a guest. |
| `POST /guests/search` | Front desk | Body `{ "query": "..." }`, 2 to 80 characters. |
| `GET /rooms` | Housekeeping | Active rooms. |
| `PATCH /rooms/:id/status` | Housekeeping | Manual status. `OCCUPIED` is refused. |
| `POST /bookings/quote` | Front desk | Returns nights, nightly rate, tax, discount, and total. |
| `POST /bookings` | Front desk | Creates a confirmed booking from the same fields as the quote. |
| `POST /bookings/:id/check-in` | Front desk | Occupies the room when the property date is inside the stay. |
| `POST /bookings/:id/check-out` | Front desk | Refuses a balance. Sets the room to `CLEANING`. |
| `POST /bookings/:id/payments` | Front desk | Header `Idempotency-Key` (UUID). Body `{ "amount": "1500.00", "paymentMethod": "CASH" }`. |
| `POST /bookings/:id/payments/:paymentId/reversal` | Manager | Reverses that receipt in full. |
| `DELETE /bookings/:id` | Front desk | Refused. Bookings are not deleted. |

Quote and create accept `guestId`, `roomId`, `checkInDate`, `checkOutDate` (`YYYY-MM-DD`), and `numberOfGuests`. Optional fields are `discountBasisPoints`, `discountReason`, `specialRequests`, `internalNotes`, and `bookingSource`.

Payment methods are `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`, and `CHEQUE`. A reference that looks like a card number (12 to 19 digits) is rejected.

Stay overlap is `[check-in, check-out)`. The same room can turn over on the checkout morning. `CANCELLED` and `NO_SHOW` do not block the room. `OUT_OF_ORDER` and `MAINTENANCE` rooms cannot be sold.

## Data the API stores

TypeORM writes `snake_case` columns.

- `users` — email, password hash, name, role, status.
- `guests` — name, email, phone, and optional address, city, country, id type, id number, and notes.
- `rooms` — room number, floor, type (`STANDARD`, `DELUXE`, `SUITE`, `FAMILY`, `PRESIDENTIAL`), status (`AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`, `OUT_OF_ORDER`), rack rate as a decimal string, occupancy, and active flag.
- `bookings` — guest, room, dates, nights, rate, tax, discount, total, paid amount, status (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`), payment status (`PENDING`, `PARTIAL`, `PAID`, `REFUNDED`), and confirmation number. Checks keep amounts at or above zero and paid amount at or under the total.
- `payments` — booking, decimal amount, `amount_paise`, method, `RECEIPT` or `REVERSAL`, idempotency key, and the receipt a reversal corrects. Bookings cannot be deleted while a payment row points at them.
- `properties` — owner-managed property row. The desk does not price from it.

There is no `room_types` table, no amenities catalog, and no database audit table in the request path. File logs cover the audit events the desk writes.

## Admin panel

| Route | What it does |
| --- | --- |
| `/login` | Work email and password. No credential hint on the page. |
| `/` | Dashboard shell. |
| `/bookings` | List, details, check-in, checkout, cancel, record a receipt, and create a booking from a server quote. |
| `/rooms` | Grid, details, and status changes that leave occupancy to the booking. |
| `/guests` | Search, and a form for first name, last name, email, and phone. |

## Commands

```bash
pnpm run dev          # API and admin panel
pnpm run dev:api
pnpm run dev:admin
pnpm run docker:up
pnpm run docker:down
pnpm run docker:logs
pnpm run build
pnpm run start        # production API
```

```bash
pnpm --filter @blueberry/api-core run test
pnpm --filter @blueberry/api-core run seed
pnpm --filter @blueberry/api-core run migration:run
pnpm --filter admin-panel run test
```

Current unit tests: 6 API suites (27 tests) covering money, guests, rooms, and the app shell, plus 3 admin auth-store tests. There is no Postgres end-to-end suite yet.

## Next

1. Guest register details the property must keep, including identity fields already on the guest row.
2. GST folio and invoice, using the tax rate from the environment.
3. Housekeeping board beyond the room status control.
4. Desk reports for occupancy and money received.

The website, point of sale, channel manager, and a content system stay later. The ledger will keep recording money received at the desk.
