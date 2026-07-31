# API Integration

Maps every frontend component/page to the backend endpoint(s) it consumes. Backend: Express + Prisma, mounted under `/api` (see `../FixitNow`). Base URL is `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`).

All calls go through `src/lib/api/client.ts`'s `apiFetch()`, which unwraps the backend's `{success, message, data, meta}` envelope, attaches `Authorization: Bearer <token>` from the Zustand auth store automatically, and throws a typed `ApiError` (status + Zod field errors) on failure.

## Auth

| Frontend | Endpoint | Notes |
|---|---|---|
| `/auth/register` | `POST /auth/register` | role picker (CUSTOMER/TECHNICIAN), Zod-validated |
| `/auth/login` | `POST /auth/login` | |
| `AuthHydrator` (mounted app-wide in `Providers`) | `GET /auth/me` | runs once on load to restore session from the stored token; gates `isHydrated` that every authenticated query waits on |

## Public browsing

| Frontend | Endpoint | Notes |
|---|---|---|
| `/` (home) | `GET /services`, `GET /categories` | featured services (newest first) + category chips |
| `/services` (`services-browser.tsx`) | `GET /services`, `GET /technicians`, `GET /categories` | category/price/search filters + pagination for both the services and technicians sections independently |
| `/technicians/[id]` | `GET /technicians/:id` | profile, services, and reviews all come back in one response |

## Customer flow

| Frontend | Endpoint | Notes |
|---|---|---|
| `/book/[serviceId]` | `GET /services/:id`, `POST /bookings` | plain datetime input, not a slot picker — see "Known gaps" below |
| `/dashboard/customer` | `GET /bookings`, `GET /payments` | booking history + payment history |
| Cancel button (`booking-row.tsx`) | `PATCH /bookings/:id/cancel` | only rendered for `REQUESTED`/`ACCEPTED`/`PAID` |
| Pay button | `POST /payments/create` | redirects to the returned Stripe/SSLCommerz URL |
| `/payment/success` | `POST /payments/confirm` | finalizes the booking as `PAID` |
| `/payment/cancel` | — | no call; just tells the user checkout was cancelled |
| Review form on a `COMPLETED` booking | `POST /reviews` | a `409` (already reviewed) is treated as success — no endpoint exists to check in advance |

## Technician flow

| Frontend | Endpoint | Notes |
|---|---|---|
| `technician-profile-form.tsx` | `PUT /technician/profile` | bio/experience/location; there is no `GET` — the profile is read from `AuthUser.technicianProfile`, populated by login/register/getMe |
| `technician-services-manager.tsx` | `GET /services?technicianId=`, `POST /services`, `PUT /services/:id`, `DELETE /services/:id` | full CRUD on the technician's own services |
| `technician-availability-manager.tsx` | `GET /technician/availability`, `PUT /technician/availability` | replace-all semantics; booked slots are shown read-only |
| `/dashboard/technician/bookings` | `GET /technician/bookings`, `PATCH /technician/bookings/:id` | `action`: `ACCEPT` / `DECLINE` / `START` / `COMPLETE` |

## Admin flow

| Frontend | Endpoint | Notes |
|---|---|---|
| `/dashboard/admin` (overview) | `GET /admin/stats` | user counts by role/status, booking counts by status, category count, total completed-payment revenue |
| `/dashboard/admin/users` | `GET /admin/users`, `PATCH /admin/users/:id` | role/status/search filters, paginated; `PATCH` body `{status: 'ACTIVE'\|'BANNED'}` |
| `/dashboard/admin/categories` | `GET /categories` (read), `POST /admin/categories`, `PUT /admin/categories/:id`, `DELETE /admin/categories/:id` | list reuses the public read endpoint since the data is identical; mutations are admin-gated |

**Not consumed by the frontend**: `GET /admin/bookings` exists on the backend (paginated, filterable all-bookings list) but the admin UI doesn't call it — `/admin/stats`'s per-status breakdown covers the "platform health" requirement without needing the raw list.

## Known deliberate gaps vs. the spec

- **Booking time-slot picker**: the backend never checks the `Availability` table when creating a booking, and has no endpoint to fetch a technician's open slots for a given date. `/book/[serviceId]` uses a plain `datetime-local` input instead of an available-vs-booked visual picker.
- **Technician profile picture**: `TechnicianProfile` has no photo field in the schema, so there is no upload UI for it.
