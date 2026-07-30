# Foundation & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the FixItNow frontend's foundation: a working Next.js app with a typed API client, JWT auth (register/login), cookie-bridged Next.js Middleware route protection, and the shared error/loading UI patterns every later sub-project reuses.

**Architecture:** Next.js App Router with a thin typed API client wrapping the Express backend's `{success, data, meta}` envelope. Zustand holds the authenticated user in memory, hydrated on load from a client-set cookie via `GET /auth/me`. `src/proxy.ts` (Next.js's current name for what was previously the `middleware.ts` convention — this installed version deprecated the old name) reads that same cookie (unsigned decode — routing convenience, not a security boundary) to gate `/dashboard/<role>` access. TanStack Query handles server-state caching/mutations; Shadcn UI supplies accessible form/toast/skeleton primitives.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Shadcn UI · TanStack Query · Zustand · React Hook Form + Zod · js-cookie · `node:test` (via `tsx`) for unit tests

## Global Constraints

- TypeScript is mandatory (assignment: "TypeScript | Type safety (Mandatory)")
- All forms use React Hook Form + Zod (assignment mandatory requirement #4)
- All API errors and form validation errors must show user-friendly, structured UI feedback — toasts, inline form errors, or error boundaries (assignment mandatory requirement #2)
- Protected routes must use Next.js Middleware (assignment "Key Rules")
- 20 meaningful frontend commits with conventional messages, e.g. `feat: add role-based dashboard layout` (assignment mandatory requirement #3) — every task below ends with its own commit toward this count
- Node >=20 (matches the backend; required by the `node --import tsx --test` runner used here)

Reference spec: `docs/superpowers/specs/2026-07-30-foundation-auth-design.md`

---

### Task 1: Scaffold Next.js app, install dependencies, initialize Shadcn UI

**Files:**
- Create: entire Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/`, `public/`, `.gitignore`, `next-env.d.ts`) — uses `--src-dir`, so app code lives under `src/`
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*` (shadcn init + components)
- Create: `.env.example`, `.env.local`

**Interfaces:**
- Produces: `npm run dev` / `npm run build` / `npm run lint` / `npm test` scripts; shadcn primitives under `@/components/ui/*`; `cn()` helper at `@/lib/utils`; env var `NEXT_PUBLIC_API_URL`.

- [ ] **Step 1: Scaffold into a temp directory (avoids conflicts with the existing `docs/` and `.git/`)**

```bash
cd /Users/joyntoghosh/FixItNow-frontend
npx --yes create-next-app@latest tmp-scaffold \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

If any prompt appears despite these flags, accept the shown default.

- [ ] **Step 2: Move the scaffold into the repo root**

```bash
rm -rf tmp-scaffold/.git
shopt -s dotglob nullglob
mv tmp-scaffold/* .
rmdir tmp-scaffold
```

- [ ] **Step 3: Install runtime and dev dependencies**

```bash
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers js-cookie
npm install -D @types/js-cookie tsx
```

- [ ] **Step 4: Initialize Shadcn UI with defaults, add the components this sub-project needs**

This shadcn CLI generation (v4.x, "base-nova" style on Base UI) no longer ships a `form` component — its registry entry is an intentionally empty stub (no `Form`/`FormField`/`FormControl`/`FormItem`/`FormLabel`/`FormMessage`). Its replacement is `field` (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`, ...), designed to pair directly with react-hook-form's own `register`/`Controller` — no context-wrapper component needed. Install `field` instead of `form`; it pulls in `separator` automatically as its one registry dependency.

```bash
npx --yes shadcn@latest init -d
npx --yes shadcn@latest add button input label card sonner skeleton dropdown-menu select field
```

- [ ] **Step 5: Add the `test` script to `package.json`**

Modify the `"scripts"` section to add:

```json
"test": "node --import tsx --test src/lib/api/client.test.ts"
```

(This file doesn't exist yet — Task 2 creates it. Listing it now keeps the script and the test suite in sync as later tasks add files to this same list. Path is `src/lib/...`, not `lib/...`, because this scaffold uses `--src-dir`.)

- [ ] **Step 6: Create env files**

`.env.example` (committed):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`.env.local` (gitignored by the scaffold's default `.gitignore`, same value, for local dev against the backend running on port 4000):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

- [ ] **Step 7: Verify the scaffold builds**

Run: `npm run build`
Expected: build succeeds (default Next.js starter page compiles).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, shadcn ui, and core dependencies"
```

---

### Task 2: API client and typed errors

**Files (all under `src/` — this scaffold uses `--src-dir`; import paths below already use the `@/*` alias, which maps to `src/*` regardless):**
- Create: `src/lib/api/error.ts`
- Create: `src/lib/api/client.ts`
- Test: `src/lib/api/client.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (uses `NEXT_PUBLIC_API_URL` from Task 1's `.env.local`).
- Produces: `class ApiError extends Error { status: number; errorDetails: {field: string; message: string}[] | null }`; `stripFieldPrefix(field: string): string`; `apiFetch<T>(path: string, options?: {token?: string | null; body?: unknown} & Omit<RequestInit, 'body'>): Promise<{data: T; meta?: Record<string, unknown>}>`.

- [ ] **Step 1: Write `src/lib/api/error.ts`**

The backend validates each request as a whole `{body, query, params}` object (see `src/middlewares/validate.middleware.ts` in the backend repo), so a Zod failure on, say, the `email` field comes back as `errorDetails: [{field: "body.email", ...}]`, not `{field: "email", ...}`. Every form in every future sub-project needs this prefix stripped before mapping to React Hook Form's flat field names, so it belongs here alongside `ApiError`, not duplicated per-form.

```ts
export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorDetails: ApiErrorDetail[] | null;

  constructor(status: number, message: string, errorDetails: ApiErrorDetail[] | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorDetails = errorDetails;
  }
}

// Backend Zod issues are paths into {body, query, params} (e.g. "body.email",
// "body.slots.0.endTime"). Strip just the outer namespace so the rest maps
// directly onto React Hook Form's (possibly nested/array) field names.
export const stripFieldPrefix = (field: string): string => field.replace(/^(body|query|params)\./, '');
```

- [ ] **Step 2: Write the failing test `src/lib/api/client.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch } from './client';
import { ApiError, stripFieldPrefix } from './error';

test('stripFieldPrefix strips the body/query/params namespace but keeps nested paths', () => {
  assert.equal(stripFieldPrefix('body.email'), 'email');
  assert.equal(stripFieldPrefix('body.slots.0.endTime'), 'slots.0.endTime');
  assert.equal(stripFieldPrefix('query.page'), 'page');
  assert.equal(stripFieldPrefix('role'), 'role');
});

const originalFetch = global.fetch;
const originalEnv = process.env.NEXT_PUBLIC_API_URL;

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api';
});

test.afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_API_URL = originalEnv;
});

test('apiFetch returns data on a successful envelope', async () => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ success: true, message: 'ok', data: { id: '1' } }), { status: 200 })) as typeof fetch;

  const result = await apiFetch<{ id: string }>('/technicians/1');
  assert.deepEqual(result.data, { id: '1' });
});

test('apiFetch throws ApiError with errorDetails on a failed envelope', async () => {
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: 'Validation failed',
        errorDetails: [{ field: 'email', message: 'A valid email is required' }],
      }),
      { status: 400 }
    )) as typeof fetch;

  await assert.rejects(
    () => apiFetch('/auth/register', { method: 'POST', body: { email: 'bad' } }),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.deepEqual(err.errorDetails, [{ field: 'email', message: 'A valid email is required' }]);
      return true;
    }
  );
});

test('apiFetch throws ApiError on a network-level non-JSON failure status with no envelope fields', async () => {
  global.fetch = (async () => new Response(JSON.stringify({ success: false, message: 'Not found' }), { status: 404 })) as typeof fetch;

  await assert.rejects(
    () => apiFetch('/bookings/does-not-exist'),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.equal(err.errorDetails, null);
      return true;
    }
  );
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 4: Write `src/lib/api/client.ts`**

```ts
import { ApiError } from './error';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errorDetails?: { field: string; message: string }[] | null;
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  body?: unknown;
}

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  return url;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ data: T; meta?: Record<string, unknown> }> => {
  const { token, body, headers, ...rest } = options;

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !envelope.success) {
    throw new ApiError(response.status, envelope.message, envelope.errorDetails ?? null);
  }

  return { data: envelope.data, meta: envelope.meta };
};
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npm test`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/error.ts src/lib/api/client.ts src/lib/api/client.test.ts package.json
git commit -m "feat: add typed API client wrapping the backend response envelope"
```

---

### Task 3: Auth constants, role decoding, cookie helpers, Zustand store

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/lib/auth/constants.ts`
- Create: `src/lib/auth/decode-role.ts`
- Test: `src/lib/auth/decode-role.test.ts`
- Create: `src/lib/auth/cookie.ts`
- Create: `src/lib/auth/store.ts`
- Modify: `package.json` (test script)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `AUTH_COOKIE_NAME: string`, `AUTH_COOKIE_MAX_AGE_DAYS: number`, `ROLE_DASHBOARD_PATH: Record<Role, string>` from `src/lib/auth/constants.ts`; `type Role = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN'` and `decodeRoleFromToken(token: string): Role | null` from `src/lib/auth/decode-role.ts`; `setAuthCookie(token: string): void`, `getAuthCookie(): string | undefined`, `clearAuthCookie(): void` from `src/lib/auth/cookie.ts`; `useAuthStore` (zustand hook) exposing `{user: AuthUser | null; token: string | null; isHydrated: boolean; setAuth(user, token); clearAuth(); setHydrated()}` and `interface AuthUser {id, name, email, phone, role, status}` from `src/lib/auth/store.ts`.

Note: only `decode-role.ts` gets a test in this task — it has real branching logic (valid/invalid/malformed). `cookie.ts` and `store.ts` are thin pass-throughs to `js-cookie`/`zustand` with no independent logic, so they're not tested separately. `decode-role.ts` is written before `constants.ts` so the latter can import the `Role` type instead of redeclaring the same union.

- [ ] **Step 1: Write the failing test `src/lib/auth/decode-role.test.ts`**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeRoleFromToken } from './decode-role';

const makeFakeToken = (payload: Record<string, unknown>): string => {
  const base64url = (input: string) =>
    Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
};

test('decodeRoleFromToken reads a valid role claim', () => {
  const token = makeFakeToken({ userId: 'abc', role: 'TECHNICIAN' });
  assert.equal(decodeRoleFromToken(token), 'TECHNICIAN');
});

test('decodeRoleFromToken returns null for an unrecognized role', () => {
  const token = makeFakeToken({ userId: 'abc', role: 'SUPERUSER' });
  assert.equal(decodeRoleFromToken(token), null);
});

test('decodeRoleFromToken returns null for a malformed token', () => {
  assert.equal(decodeRoleFromToken('not-a-jwt'), null);
});
```

- [ ] **Step 2: Update `package.json`'s test script to include this test file**

```json
"test": "node --import tsx --test src/lib/api/client.test.ts src/lib/auth/decode-role.test.ts"
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './decode-role'`

- [ ] **Step 4: Write `src/lib/auth/decode-role.ts`**

```ts
export type Role = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

const VALID_ROLES: Role[] = ['CUSTOMER', 'TECHNICIAN', 'ADMIN'];

// Edge-runtime-safe (no Buffer): normalizes base64url to base64 and pads it before atob.
export const decodeRoleFromToken = (token: string): Role | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { role?: unknown };
    return VALID_ROLES.includes(json.role as Role) ? (json.role as Role) : null;
  } catch {
    return null;
  }
};
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npm test`
Expected: PASS (7 tests total)

- [ ] **Step 6: Write `src/lib/auth/constants.ts`**

```ts
import type { Role } from './decode-role';

export const AUTH_COOKIE_NAME = 'fixitnow_token';
export const AUTH_COOKIE_MAX_AGE_DAYS = 7;

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
};
```

- [ ] **Step 7: Write `src/lib/auth/cookie.ts`**

```ts
import Cookies from 'js-cookie';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_DAYS } from './constants';

export const setAuthCookie = (token: string): void => {
  Cookies.set(AUTH_COOKIE_NAME, token, { expires: AUTH_COOKIE_MAX_AGE_DAYS, sameSite: 'lax' });
};

export const getAuthCookie = (): string | undefined => Cookies.get(AUTH_COOKIE_NAME);

export const clearAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_NAME);
};
```

- [ ] **Step 8: Write `src/lib/auth/store.ts`**

```ts
import { create } from 'zustand';
import type { Role } from './decode-role';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'ACTIVE' | 'BANNED';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
  setHydrated: () => set({ isHydrated: true }),
}));
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/auth/ package.json
git commit -m "feat: add auth cookie helpers, role decoding, and zustand session store"
```

---

### Task 4: Auth Zod schemas and API functions

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/lib/validations/auth.ts`
- Create: `src/lib/api/auth.ts`

**Interfaces:**
- Consumes: `apiFetch` from `src/lib/api/client.ts` (Task 2); `AuthUser` from `src/lib/auth/store.ts` (Task 3).
- Produces: `registerFormSchema`, `loginFormSchema` (Zod) and `RegisterFormValues`, `LoginFormValues` types from `src/lib/validations/auth.ts`; `registerUser(input): Promise<{user: AuthUser; token: string}>`, `loginUser(input): Promise<{user: AuthUser; token: string}>`, `getMe(token): Promise<AuthUser>` from `src/lib/api/auth.ts`.

No dedicated test: these are direct mirrors of the backend's own already-validated schemas, and thin pass-throughs to the already-tested `apiFetch`. Verified directly against the installed `zod@4.4.3`: `.trim()`, `.min(n, message)`, `.max(n)`, `.email(message)`, `.optional()`, and array-form `.enum([...])` all still work exactly as written, custom messages included.

- [ ] **Step 1: Write `src/lib/validations/auth.ts`, mirroring the backend's `registerSchema`/`loginSchema` field-for-field**

```ts
import { z } from 'zod';

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(6, 'Phone must be at least 6 characters').max(20).optional(),
  role: z.enum(['CUSTOMER', 'TECHNICIAN']),
});
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
```

- [ ] **Step 2: Write `src/lib/api/auth.ts`**

```ts
import { apiFetch } from './client';
import type { AuthUser } from '../auth/store';

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const registerUser = async (input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
}): Promise<AuthResponse> => {
  const { data } = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input });
  return data;
};

export const loginUser = async (input: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input });
  return data;
};

export const getMe = async (token: string): Promise<AuthUser> => {
  const { data } = await apiFetch<AuthUser>('/auth/me', { token });
  return data;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/auth.ts src/lib/api/auth.ts
git commit -m "feat: add auth validation schemas and API functions"
```

---

### Task 5: Root providers, layout, and error/loading/not-found fallbacks

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/loading.tsx`

**Interfaces:**
- Consumes: shadcn `Toaster` from `@/components/ui/sonner`, `Button` from `@/components/ui/button`, `Skeleton` from `@/components/ui/skeleton` (Task 1).
- Produces: `Providers` component wrapping `QueryClientProvider` + `Toaster`, mounted in the root layout.

No dedicated test: JSX wiring with no branching logic.

- [ ] **Step 1: Write `src/components/providers.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Write `src/app/error.tsx`**

```tsx
'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">{error.message || 'An unexpected error occurred. Please try again.'}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/not-found.tsx`**

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/app/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-4 p-8">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

- [ ] **Step 6: Verify the build still succeeds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/providers.tsx src/app/layout.tsx src/app/error.tsx src/app/not-found.tsx src/app/loading.tsx
git commit -m "feat: add root providers and global error/loading/not-found pages"
```

---

### Task 6: Auth hydration on load

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/components/auth-hydrator.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 3), `getAuthCookie`/`clearAuthCookie` (Task 3), `getMe` (Task 4).
- Produces: `AuthHydrator` component, mounted once in the root layout, that populates `useAuthStore` on first load.

No dedicated test: composition of already-tested/trivial units, exercised manually per Task 9's verification steps.

- [ ] **Step 1: Write `src/components/auth-hydrator.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { getAuthCookie, clearAuthCookie } from '@/lib/auth/cookie';
import { getMe } from '@/lib/api/auth';

export function AuthHydrator() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    const token = getAuthCookie();
    if (!token) {
      setHydrated();
      return;
    }
    getMe(token)
      .then((user) => setAuth(user, token))
      .catch(() => {
        clearAuthCookie();
        clearAuth();
      })
      .finally(() => setHydrated());
  }, [setAuth, clearAuth, setHydrated]);

  return null;
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` to mount it**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthHydrator } from '@/components/auth-hydrator';

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthHydrator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth-hydrator.tsx src/app/layout.tsx
git commit -m "feat: hydrate auth session on load via GET /auth/me"
```

---

### Task 7: Proxy (formerly "middleware") for role-gated dashboard routing

**This Next.js version (16.2.12) deprecated the `middleware.ts` file convention** and renamed it to `proxy.ts` — confirmed directly against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` in the installed package, not assumed from prior Next.js versions. The exported function is renamed `middleware` → `proxy` (named export); `NextRequest`/`NextResponse`/`config.matcher` are unchanged. Per that doc: "Create a `proxy.ts` (or `.js`) file in the project root, or inside `src` if applicable, so that it is located at the same level as `pages` or `app`" — this scaffold uses `--src-dir`, so it goes in `src/proxy.ts`, not the repo root.

**Files:**
- Create: `src/proxy.ts`

**Interfaces:**
- Consumes: `AUTH_COOKIE_NAME`, `ROLE_DASHBOARD_PATH` (Task 3's `src/lib/auth/constants.ts`), `decodeRoleFromToken` (Task 3's `src/lib/auth/decode-role.ts`, already tested).
- Produces: redirects unauthenticated or wrong-role requests away from `/dashboard/<role>/*`.

No new test: the only branching logic (`decodeRoleFromToken`) is already covered in Task 3; the rest is direct wiring.

- [ ] **Step 1: Write `src/proxy.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { decodeRoleFromToken } from '@/lib/auth/decode-role';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const role = decodeRoleFromToken(token);
  const expectedSegment = role ? ROLE_DASHBOARD_PATH[role] : undefined;

  if (!expectedSegment) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const requestedSegment = request.nextUrl.pathname.split('/')[2];
  if (requestedSegment !== expectedSegment) {
    return NextResponse.redirect(new URL(`/dashboard/${expectedSegment}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

- [ ] **Step 2: Verify the build still succeeds**

Run: `npm run build`
Expected: build succeeds, with no "middleware is deprecated" or unrecognized-file warnings.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add proxy to gate dashboard routes by role"
```

---

### Task 8: Navbar

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/components/layout/navbar.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `clearAuthCookie`, `ROLE_DASHBOARD_PATH` (Task 3); shadcn `Button`, `DropdownMenu*` (Task 1).
- Produces: `Navbar` component, mounted in the root layout.

No dedicated test: presentational component.

- [ ] **Step 1: Write `src/components/layout/navbar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { clearAuthCookie } from '@/lib/auth/cookie';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuthCookie();
    clearAuth();
    router.push('/');
  };

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-lg font-semibold">
          FixItNow
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/services" className="text-sm">
            Browse services
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{user.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` to mount it**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthHydrator } from '@/components/auth-hydrator';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthHydrator />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/navbar.tsx src/app/layout.tsx
git commit -m "feat: add role-aware navbar"
```

---

### Task 9: Register and login pages

**This shadcn generation has no `Form`/`FormField`/`FormControl`/`FormItem`/`FormLabel`/`FormMessage`** (Task 1 confirmed the `form` registry entry is a dead stub in this CLI version). Build directly against react-hook-form's own `register`/`Controller`/`formState.errors`, paired with shadcn's `Field`/`FieldLabel`/`FieldError`/`FieldGroup` (installed in Task 1) for layout and error display. `FieldError` takes an `errors` prop shaped as `Array<{message?: string} | undefined>` — pass `field.error ? [field.error] : undefined` reading from `formState.errors`.

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/app/auth/register/page.tsx`
- Create: `src/app/auth/login/page.tsx`

**Interfaces:**
- Consumes: `registerFormSchema`/`loginFormSchema`, `registerUser`/`loginUser` (Task 4); `setAuthCookie` (Task 3); `useAuthStore` (Task 3); `ROLE_DASHBOARD_PATH` (Task 3); `ApiError`, `stripFieldPrefix` (Task 2); shadcn `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `Input`, `Button`, `Card`, `Select` (Task 1); `Controller` from `react-hook-form`.
- Produces: working `/auth/register` and `/auth/login` pages.

No automated test (no test framework for component/e2e behavior per the spec) — manual verification steps below.

- [ ] **Step 1: Write `src/app/auth/register/page.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerFormSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { registerUser } from '@/lib/api/auth';
import { setAuthCookie } from '@/lib/auth/cookie';
import { useAuthStore } from '@/lib/auth/store';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', role: 'CUSTOMER' },
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: ({ user, token }) => {
      setAuthCookie(token);
      setAuth(user, token);
      toast.success('Account created');
      router.push(`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof RegisterFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    mutation.mutate({ ...values, phone: values.phone || undefined });
  };

  return (
    <div className="mx-auto max-w-sm py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" {...register('name')} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...register('email')} />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" {...register('password')} />
                <FieldError errors={errors.password ? [errors.password] : undefined} />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <Input id="phone" {...register('phone')} />
                <FieldError errors={errors.phone ? [errors.phone] : undefined} />
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">I am a</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                        <SelectItem value="TECHNICIAN">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.role ? [errors.role] : undefined} />
              </Field>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/auth/login/page.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loginFormSchema, type LoginFormValues } from '@/lib/validations/auth';
import { loginUser } from '@/lib/api/auth';
import { setAuthCookie } from '@/lib/auth/cookie';
import { useAuthStore } from '@/lib/auth/store';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: ({ user, token }) => {
      setAuthCookie(token);
      setAuth(user, token);
      toast.success('Welcome back');
      router.push(`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof LoginFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Login failed');
    },
  });

  return (
    <div className="mx-auto max-w-sm py-12">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" {...register('email')} />
                <FieldError errors={errors.email ? [errors.email] : undefined} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" {...register('password')} />
                <FieldError errors={errors.password ? [errors.password] : undefined} />
              </Field>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Logging in...' : 'Log in'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Manually verify against the running backend**

Run the backend (`cd /Users/joyntoghosh/FixitNow && npm run dev`) and this app (`npm run dev`), then:
1. Visit `/auth/register`, submit with a name under 2 characters — expect an inline "Name must be at least 2 characters" error, no network call.
2. Submit a valid Customer registration — expect a success toast, a `fixitnow_token` cookie set, and a redirect to `/dashboard/customer`.
3. Repeat registration with the same email — expect a top-of-form/toast error surfacing the backend's 409 "An account with this email already exists".
4. Log out, visit `/auth/login`, log in with one of the backend's seeded demo accounts (see the backend README's demo accounts table) — expect redirect to that account's role dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add register and login pages"
```

---

### Task 10: Dashboard shell, per-role stub pages, payment stub pages

**Files (all under `src/` — this scaffold uses `--src-dir`):**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/customer/page.tsx`
- Create: `src/app/dashboard/technician/page.tsx`
- Create: `src/app/dashboard/admin/page.tsx`
- Create: `src/app/payment/success/page.tsx`
- Create: `src/app/payment/cancel/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore` (Task 3), `cn()` (Task 1's shadcn init output at `@/lib/utils`).
- Produces: `/dashboard/{customer,technician,admin}` and `/payment/{success,cancel}` routes. Per-role and payment page content beyond this shell is out of scope for this sub-project (see the design spec).

No automated test — manual verification below (this task is markup plus the already-tested middleware from Task 7).

- [ ] **Step 1: Write `src/app/dashboard/layout.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Record<'customer' | 'technician' | 'admin', { href: string; label: string }[]> = {
  customer: [{ href: '/dashboard/customer', label: 'Overview' }],
  technician: [{ href: '/dashboard/technician', label: 'Overview' }],
  admin: [{ href: '/dashboard/admin', label: 'Overview' }],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const segment = pathname.split('/')[2] as 'customer' | 'technician' | 'admin' | undefined;
  const items = segment ? NAV_ITEMS[segment] : [];

  return (
    <div className="mx-auto flex max-w-6xl gap-8 p-6">
      <aside className="w-48 shrink-0">
        <p className="mb-4 text-sm font-medium text-muted-foreground">{user?.name}</p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm',
                pathname === item.href ? 'bg-muted font-medium' : 'hover:bg-muted/50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/dashboard/customer/page.tsx`**

```tsx
export default function CustomerDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Customer dashboard</h1>
      <p className="text-muted-foreground mt-2">Your bookings and payment history will appear here.</p>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/dashboard/technician/page.tsx`**

```tsx
export default function TechnicianDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Technician dashboard</h1>
      <p className="text-muted-foreground mt-2">Your upcoming jobs, earnings, and pending requests will appear here.</p>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/dashboard/admin/page.tsx`**

```tsx
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p className="text-muted-foreground mt-2">Platform-wide user and booking oversight will appear here.</p>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/app/payment/success/page.tsx`**

```tsx
export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <p className="text-muted-foreground mt-2">
        Booking status updates will appear here once payment integration is wired up.
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/payment/cancel/page.tsx`**

```tsx
export default function PaymentCancelPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="text-muted-foreground mt-2">Your booking hasn&apos;t been paid for yet. You can retry from your bookings list.</p>
    </div>
  );
}
```

- [ ] **Step 7: Manually verify role-gating end to end**

Using the backend's seeded demo accounts (customer/technician/admin, see backend README):
1. Log in as each role and confirm landing on its own `/dashboard/<role>` page.
2. While logged in as a customer, manually navigate to `/dashboard/admin` — expect a redirect back to `/dashboard/customer`.
3. Log out (or clear the `fixitnow_token` cookie) and visit any `/dashboard/*` URL directly — expect a redirect to `/auth/login`.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/ src/app/payment/
git commit -m "feat: add dashboard shell, per-role stub pages, and payment stub pages"
```
