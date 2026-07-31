# FixItNow Frontend

Next.js frontend for FixItNow, a home-services marketplace (Assignment 5). Consumes the backend at `../FixitNow` (Express + TS + Prisma). Full requirements: `/Users/joyntoghosh/Downloads/3-FixItNow-Frontend.md` and `README-2.md`.

Built in 5 sub-projects, each with its own spec/plan under `docs/superpowers/specs/` and `docs/superpowers/plans/`:
1. **Foundation & Auth** — done (this covers scaffold, API client, auth, routing, shared error/loading patterns)
2. Public browsing (home, services grid, technician profiles) — not started
3. Customer flow (booking, payment, reviews) — not started
4. Technician flow (profile, availability, booking management) — not started
5. Admin flow (users, categories, platform overview) — not started

**Process note:** Sub-project 1 was built via brainstorm → spec → plan → subagent-driven-development (the `superpowers` plugin). Going forward, building natively — direct implementation with build/lint/browser verification — since the heavy multi-agent review process cost far more time and tokens than its value justified for a project this size.

## Tech stack gotchas (verified against the actually-installed versions — don't assume from training data)

- **Next.js 16.2.12**, App Router, `--src-dir` (everything lives under `src/`, not repo root).
- **`src/proxy.ts`, not `middleware.ts`.** This Next.js version deprecated and renamed the convention. Exported function is named `proxy`, not `middleware`. Confirm against `node_modules/next/dist/docs/` before assuming anything about file-convention names — this version has real breaking changes vs. older docs/training data.
- **Shadcn UI is Base UI-based here, not Radix** (`"style": "base-nova"` in `components.json`). Concretely:
  - No `Form`/`FormField`/`FormControl`/`FormItem`/`FormLabel`/`FormMessage` — that registry entry is an empty stub. Build forms directly against react-hook-form's `register`/`Controller`/`formState.errors`, paired with `Field`/`FieldLabel`/`FieldError`/`FieldGroup` (`src/components/ui/field.tsx`). `FieldError` takes `errors={fieldState.error ? [fieldState.error] : undefined}`.
  - No `asChild` prop anywhere. Composition uses Base UI's `render` prop: `<Button render={<Link href="/x">text</Link>} />`, not `<Button asChild><Link>text</Link></Button>`. This applies to `Button`, `DropdownMenuTrigger`, `DropdownMenuItem`, and presumably every other Base UI-backed component here. Getting this wrong doesn't fail typecheck — it silently renders invalid nested-interactive HTML (`<button><a>...</a></button>`).
  - `Select` needs an `items` prop (`Record<value, label>`) to show human labels in the closed trigger — `SelectItem` children only render inside the open popup list.
- **Zod v4.4.3.** The classic chainable API (`.trim()`, `.min(n, msg)`, `.email(msg)`, `.optional()`, array-form `.enum([...])`) still works with custom messages — verified directly, no v3→v4 migration needed for what's used here.
- Data fetching: TanStack Query. State: Zustand (`src/lib/auth/store.ts`). Forms: React Hook Form + Zod. Cookies: `js-cookie`. Tests: `node:test` via `tsx` (no test framework installed — deliberate, see the Foundation & Auth spec's Testing section).

## Architecture

- `src/lib/api/client.ts` — `apiFetch<T>()`, unwraps the backend's `{success, message, data, meta}` envelope, throws typed `ApiError`.
- `src/lib/api/error.ts` — `ApiError` class + `stripFieldPrefix()`. **The backend validates `{body, query, params}` as a whole**, so Zod field errors come back as `"body.email"` etc. — always strip the prefix before mapping to a form's flat field names.
- `src/lib/auth/` — `constants.ts` (cookie name, per-role dashboard paths), `decode-role.ts` (edge-safe JWT decode, no `Buffer`), `cookie.ts` (js-cookie wrapper), `store.ts` (zustand session store).
- **Auth model:** backend returns a bearer JWT in the response body only (no cookie of its own). Frontend writes it to a client-set cookie + Zustand after login/register. `src/proxy.ts` does an **unsigned decode** of that cookie for routing convenience only — it is NOT a security boundary. Every real authorization check happens backend-side on each request.
- **Not yet wired: token injection.** `apiFetch` accepts an optional `token` param but doesn't default it from the Zustand store — only `getMe` passes one today. Every authenticated call in sub-project 3+ needs this decided deliberately (explicit-per-call vs. default-from-store) before building bookings/payments/etc., or calls will silently 401.

## Known gaps carried from the backend (see the Foundation & Auth spec's "Deferred decisions" for full detail)

- **Payment redirect gap** (blocks sub-project 3): Stripe/SSLCommerz return URLs point at the backend's own `BASE_URL`, not this frontend — `/payment/success`/`/payment/cancel` won't actually be reached by a real gateway redirect until the backend adds a `FRONTEND_URL` and redirects there.
- **Admin revenue gap** (blocks sub-project 5): `GET /payments` returns empty for an admin caller (scoped to `customerId = requester.id`). No endpoint exists for admin-wide payment/revenue data yet.
- **Availability/booking disconnect** (blocks sub-project 3): booking creation never checks the `Availability` table, and there's no public endpoint to see a technician's open slots. The spec's "show available vs. booked slots" time-slot picker isn't buildable as-is without a backend change or a scoped-down plain date/time input.

## Known issue in Foundation & Auth (parked, needs a decision)

`src/app/dashboard/layout.tsx`'s redirect-to-login effect fires whenever hydration completes with no user — but that includes a transient network blip or backend 5xx during hydration, not just a confirmed logged-out state. A genuinely-still-logged-in user can get bounced to `/auth/login` by a backend hiccup, even though their session cookie is untouched. Fix: distinguish "confirmed 401/403, no session" from "hydration inconclusive" before redirecting.

## Commands

```bash
npm run dev       # http://localhost:3000
npm run build     # also typechecks
npm test          # node:test via tsx — lib/api/client.test.ts, lib/auth/decode-role.test.ts
npm run lint
```

Needs the backend running locally for real API calls: `cd ../FixitNow && npm run dev` (port 4000; see its own README for demo account credentials). `.env.local` already points `NEXT_PUBLIC_API_URL` at `http://localhost:4000/api`.

## Test data note

A harmless test account from live verification is sitting in the shared dev database: `e2e-test-1785484800@fixitnow-test.com` ("E2E Test Customer"). No user-delete endpoint exists in the backend to remove it via the API — clean up at the DB level if it bothers you.
