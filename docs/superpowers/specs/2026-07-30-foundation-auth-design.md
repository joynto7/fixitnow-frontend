# Foundation & Auth — Design Spec

Sub-project 1 of 5 for the FixItNow frontend (Assignment 5). This is the base
everything else builds on: project scaffold, API client, auth, role-based
routing, and the shared error/loading patterns every later screen reuses.

Source requirements: `README-2.md` (Assignment 5 general rules) and
`3-FixItNow-Frontend.md` (FixItNow-specific spec), both supplied by the user.
Backend: `/Users/joyntoghosh/FixitNow` (Express + TS + Prisma, already built).

## Sub-project sequence

1. **Foundation & Auth** (this doc)
2. Public browsing — home, services grid + filters, technician profile
3. Customer flow — booking creation, payment checkout, success/cancel, booking history, reviews
4. Technician flow — profile/services management, availability scheduler, booking management
5. Admin flow — user management, category management, platform overview

Each gets its own brainstorm → spec → plan → build pass. This doc covers #1 only.

## Deferred decisions (belong to later sub-projects, not this one)

Three backend gaps were found comparing the spec against the actual backend
code. None block Foundation & Auth — revisit when brainstorming the relevant
sub-project:

- **Payment redirect gap** (→ sub-project 3): Stripe's `success_url`/`cancel_url`
  and SSLCommerz's `success_url`/`fail_url`/`cancel_url` point at the backend's
  own `BASE_URL`, not the frontend. `/payment/success` and `/payment/cancel`
  won't actually be reached by a gateway redirect until this is resolved
  (likely a small backend patch: add `FRONTEND_URL`, point the provider
  return URLs at it).
- **Admin revenue gap** (→ sub-project 5): `GET /payments` scopes to
  `customerId = requester.id` for any non-technician caller, so an admin gets
  an empty list today. No `/admin/stats` or `/admin/payments` endpoint exists.
  The "platform revenue" part of the admin dashboard has no data source yet.
- **Availability/booking disconnect** (→ sub-project 3): `POST /bookings`
  takes `{serviceId, scheduledDate, address, notes}` and never checks the
  `Availability` table; there's also no public endpoint exposing a
  technician's open slots. The spec's "time-slot picker must show available
  vs. booked slots" isn't buildable as written without a backend change or a
  scoped-down interpretation (plain date/time input, no slot picker).

## Decisions made (this sub-project)

| Area | Decision | Why |
|---|---|---|
| Repo | New separate repo, `FixItNow-frontend`, sibling to the backend | Matches the assignment's separate "Frontend GitHub Repo" deliverable and keeps the 20-commit frontend history clean of backend commits |
| Package manager | npm | Matches the backend repo, zero-friction |
| UI kit | Shadcn UI | Accessible Radix-based components copied into the repo; its `Form` component is built natively around React Hook Form + Zod, which the assignment mandates |
| Data fetching | TanStack Query | First-class mutations + cache invalidation — the spec explicitly calls for "React Query invalidation" on booking-status changes |
| Global client state | Zustand | Only real cross-cutting client state is the auth session (user + role); everything else lives in TanStack Query's cache |
| Auth/Middleware bridging | Client-side cookie + Zustand hybrid | Backend returns the JWT in the response body only, no cookie. Next.js Middleware can only read cookies/headers, not localStorage, so the frontend itself writes the token into a cookie after login/register. No backend change needed; avoids proxying every endpoint through a BFF layer. |

## As built (corrections)

Implementation surfaced facts about the exact installed toolchain versions that weren't known when this spec was written. This doc's prose below is left as originally approved (it still describes the intent correctly); treat this table as the authoritative override wherever the two disagree:

| This spec says | What actually shipped | Why |
|---|---|---|
| Shadcn `Form` component, built on RHF + Zod | No `Form`/`FormField`/`FormControl`/`FormItem`/`FormLabel`/`FormMessage` exist in this shadcn generation (Base UI-based, not Radix). Forms are built directly against RHF's `register`/`Controller`/`formState.errors`, paired with shadcn's `Field`/`FieldLabel`/`FieldError`/`FieldGroup` | The installed shadcn CLI generation (`base-nova` style) dropped `Form*` entirely — its registry entry is a stub |
| `middleware.ts` | `src/proxy.ts`, exported function named `proxy` | This Next.js version (16.2.12) deprecated `middleware.ts` and renamed the convention |
| `components/layout/dashboard-shell.tsx` | `src/app/dashboard/layout.tsx` | Next.js route-group layout convention, no separate shell component needed |
| API client "attaches Bearer `<token>` from the Zustand store" automatically | Caller passes `token` explicitly per call (`apiFetch(path, {token})`); only `getMe` does today | No default-token wiring was built — every authenticated call in later sub-projects must remember to pass a token, or silently gets a 401. **Needs a deliberate decision before sub-project 3** (bookings/payments) starts — default-from-store vs. explicit-everywhere. |
| `RegisterForm` / `LoginForm` as shared components | Page-level forms (`app/auth/register/page.tsx`, `app/auth/login/page.tsx`), no extracted components | Only 2 forms exist; extraction was premature at this scale |
| A shared `toast.error(...)` helper the API client calls | The API client never toasts — each form's `onError` calls `toast.error` itself | Toasting is a UI concern; the client only throws typed errors |
| `app/dashboard/loading.tsx` | Only the root `app/loading.tsx` exists | No per-dashboard loading state was needed yet (no data fetching in the stub pages) |
| Middleware's cookie/role-gating logic is tested | `proxy.ts` itself has no test; only `decodeRoleFromToken` (the logic it calls) does | `proxy.ts` is straight-line wiring over an already-tested decode function |

## Architecture

```
app/
  (public)/page.tsx, services/, technicians/[id]/     — sub-project 2
  auth/register/page.tsx, auth/login/page.tsx          — this sub-project
  dashboard/layout.tsx                                  — role-aware shell, this sub-project
  dashboard/{customer,technician,admin}/...             — sub-projects 3-5 (empty stub pages for now)
  payment/success/page.tsx, payment/cancel/page.tsx     — stub only now, filled in sub-project 3
  layout.tsx, error.tsx, not-found.tsx, loading.tsx
middleware.ts
components/
  ui/              — shadcn-generated primitives
  layout/          — navbar.tsx, dashboard-shell.tsx
lib/
  api/
    client.ts       — fetch wrapper: base URL, auth header injection, envelope unwrapping, typed errors
    auth.ts         — register/login/me calls
  auth/
    cookie.ts       — get/set/clear the auth cookie
    store.ts        — zustand store: user, role, token, actions
  validations/
    auth.ts         — Zod schemas mirroring backend's registerSchema/loginSchema exactly
```

Env: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api` in dev) — public
because both client components and `middleware.ts` need it, and Next.js only
exposes `NEXT_PUBLIC_*` vars outside the server.

## Data flow

1. **API client** (`lib/api/client.ts`) — thin fetch wrapper. Reads
   `NEXT_PUBLIC_API_URL`, attaches `Authorization: Bearer <token>` from the
   Zustand store when present, unwraps the backend's
   `{success, message, data, meta}` envelope, and throws a typed
   `ApiError { message, errorDetails }` on `success:false` or a non-2xx
   status. Both TanStack Query's `onError` and React Hook Form's `setError`
   consume this same shape.
2. **Register / Login** — Shadcn `Form` + RHF + Zod (schema mirrors the
   backend's `registerSchema`/`loginSchema` field-for-field: `name` ≥2 chars,
   `email`, `password` ≥6 chars, `phone` optional, `role` limited to
   `CUSTOMER`/`TECHNICIAN` — no self-serve admin). Submits via
   `useMutation`. On success: write `token` to a cookie (`fixitnow_token`,
   `max-age` 7 days to match the backend's `JWT_EXPIRES_IN=7d`), set Zustand
   `{user, role, token}`, redirect to `/dashboard/{role-lowercased}`.
3. **Rehydration on load** — a small client component mounted once in the
   root layout reads the cookie and calls `GET /auth/me` to refresh Zustand
   with current user data. A 401 (banned/deleted since last visit) clears
   the cookie and Zustand and leaves the user logged out.
4. **`middleware.ts`** — on any request under `/dashboard/*`: no cookie →
   redirect to `/auth/login`; otherwise decode the JWT payload (base64
   decode only, signature not verified at the edge — this is a routing
   convenience, not a security boundary; the backend independently
   authorizes every request) and compare its `role` claim against the
   requested `/dashboard/<role>` segment, redirecting to the user's actual
   dashboard on mismatch.
5. **Logout** — clear cookie + Zustand, redirect to `/`.

## Components

- `Navbar` — public state (browse/login/register links) vs. authenticated
  state (dashboard link + logout), driven by Zustand.
- `RegisterForm` / `LoginForm` — Shadcn `Form` + RHF + Zod; backend
  `errorDetails` entries map directly to `setError(field, { message })`;
  non-field errors (e.g. 409 duplicate email) surface as a toast.
- `DashboardShell` (`app/dashboard/layout.tsx`) — role-aware sidebar shared
  by all three dashboards. Built now as a shell; per-role page content is
  out of scope for this sub-project.

## Error handling

- Shadcn `Toaster`, mounted once in the root layout, driven by a shared
  `toast.error(...)` helper the API client calls on unexpected/network
  failures.
- Form-level errors: backend `errorDetails` → RHF inline field errors.
- `app/error.tsx` and `app/not-found.tsx` for graceful 500/404 fallbacks.
- `app/dashboard/loading.tsx` + Shadcn `Skeleton` wherever TanStack Query is
  fetching.

This satisfies the assignment's mandatory "Consistent UI Error Handling"
requirement at the foundation level; later sub-projects reuse it rather than
re-implementing it per screen.

## Testing

No test framework is added. Node's built-in `node:test` covers the two
pieces of actual logic in this sub-project — the API client's
error-normalization and the middleware's cookie/role-gating — one small
test file each. Everything else here is markup/wiring, not logic.

## Out of scope for this sub-project

- Any page content under `dashboard/{customer,technician,admin}/` beyond the
  shared shell (sub-projects 3-5).
- Real content for `/payment/success` and `/payment/cancel` (sub-project 3;
  also blocked on the payment redirect gap above).
- Public browsing pages — home, services grid, technician profile
  (sub-project 2).
