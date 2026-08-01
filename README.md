# FixItNow 🔧 — Frontend

> **Your Trusted Home Service Platform**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

A responsive Next.js (App Router) frontend for a home services marketplace. Customers browse and book technicians for a real available time slot, pay via Stripe or SSLCommerz, and track jobs through to completion. Technicians manage their profile, services, an interactive availability calendar, and incoming bookings. Admins get a platform-wide moderation dashboard.

Companion backend: [`fixitnow-backend`](../FixitNow) (Express + Prisma) — this app is a pure API consumer, configured entirely through `NEXT_PUBLIC_API_URL`. No business logic lives here.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Routes](#routes)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Notes](#notes)

## Features

**Public** — home page with categories, featured services, and top-rated technicians; a filterable `/services` browse (category, location, rating, price, search); a technician profile page with bio, reviews, and a real availability-aware booking flow.

**Customer** — Zod-validated auth with role selection at signup; pick a real open slot (not a blind date field) and submit a booking request; Stripe/SSLCommerz checkout with dedicated success/cancel pages; a dashboard with booking history, status badges, eligible-only cancel, payment history, and post-completion reviews.

**Technician** — a dashboard summarizing jobs, earnings, and pending requests; profile, services, and photo management; an interactive month-grid availability calendar; a booking table with accept/decline/start/complete actions.

**Admin** — platform-wide stats; a user table with search, pagination, and ban/unban; full category CRUD.

Also: dark mode, role-protected routes via `proxy.ts`, toast notifications on every status change, and an [`/api-list`](src/app/api-list/page.tsx) page documenting every backend endpoint this app calls.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, `src/` layout) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base UI primitives) |
| Data | TanStack Query |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Theming | next-themes |
| Icons / toasts | lucide-react, Sonner |

## Getting started

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                    # http://localhost:3000
```

Needs the backend running too — see [`../FixitNow`](../FixitNow)'s README for setup and demo account credentials.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, including the `/api` suffix |

See [`.env.example`](.env.example).

## Routes

| Route | What's there |
|---|---|
| `/` | Home — categories, featured services, top-rated technicians |
| `/services` | Browse & filter services and technicians |
| `/technicians/[id]` | Profile, reviews, and the entry point to booking |
| `/auth/register` / `/auth/login` | Role-selecting signup, login |
| `/book/[serviceId]` | Pick a real available slot and submit a booking request |
| `/payment/success` / `/payment/cancel` | Post-checkout outcome pages |
| `/dashboard/customer` | Bookings, payments, reviews — payment is initiated inline here, not a separate route |
| `/dashboard/technician` | Overview, profile, services, availability calendar |
| `/dashboard/technician/bookings` | Manage incoming bookings |
| `/dashboard/admin` | Platform stats |
| `/dashboard/admin/users` | Search, paginate, ban/unban |
| `/dashboard/admin/categories` | Category CRUD |
| `/api-list` | Static reference of every backend endpoint in use |

## Project structure

```
src/
├── app/            # routes (App Router)
├── components/      # shared UI, cards, dashboard widgets
│   └── ui/           # shadcn/ui primitives
└── lib/
    ├── api/            # typed fetch wrappers per backend module
    ├── auth/            # session store, cookie, role-based routing
    └── validations/      # Zod schemas
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Runs the small `node:test` suite (API client, JWT decode) |

## Deployment

Deploys to **Vercel**:

- Import the repo, leave Root Directory as the default (`package.json` is at the repo root)
- Framework preset, build command, and output directory all auto-detect — nothing to override
- Add one environment variable: `NEXT_PUBLIC_API_URL` pointing at the deployed backend (e.g. `https://fixitnow-backend-bw9e.onrender.com/api`)
- Once deployed, set the backend's own `FRONTEND_URL` env var to this app's Vercel URL, so payment gateway redirects land back here instead of the backend's bare JSON

## Notes

- Booking creation is availability-aware (`/book/[serviceId]` shows real open vs. booked slots), with a freeform-date fallback when no slot is picked.
- No dedicated "skills" field on technician profiles — bio, experience, and their service list stand in for it.
- Only the root route has a `loading.tsx`/`error.tsx`; every page still shows real loading/error states inline via TanStack Query.

---

MIT licensed.
