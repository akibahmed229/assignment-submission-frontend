# Assignment & Submission Management System — Frontend

Next.js/TypeScript frontend for the OnnoRokom Projukti Assistant Software
Engineer assessment. Consumes the companion ASP.NET Core API — see that
project's own `README.md` for backend setup, endpoints, and demo
credentials.

## Overview

A single responsive web app serving all three roles from one login screen.
What a user sees and can do is driven entirely by their JWT's `role`
claim: Admins manage classes, subjects, teacher assignments, and student
enrollments; Teachers create/publish assignments and grade submissions for
classes they're assigned to; Students view published assignments for
their enrolled classes, submit answers, and see their grades.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Forms | React Hook Form |
| Validation | Zod (schemas double as the single source of truth for both form validation and typed API payloads) |
| API calls | Native `fetch`, wrapped in a small typed client — no React Query/SWR/axios; the app's data needs are simple enough not to need client-side caching |
| Auth | JWT stored in `localStorage`, attached as a `Bearer` header on every request |

## Architecture

```
src/
├── app/
│   ├── layout.tsx                    Root layout, wraps everything in AuthProvider
│   ├── login/page.tsx                Public login form
│   └── dashboard/
│       ├── layout.tsx                Auth guard + role-based sidebar nav
│       ├── assignments/
│       │   ├── page.tsx              List + create form (Teacher) / role-scoped list (all roles)
│       │   └── [id]/page.tsx         Detail: submit/update (Student), grade (Teacher/Admin)
│       ├── classes/page.tsx          CRUD (Admin write, everyone can read)
│       ├── subjects/page.tsx         CRUD (Admin write, everyone can read)
│       ├── teacher-assignments/page.tsx   Admin: assign teachers to class+subject
│       └── enrollments/page.tsx      Admin: enroll students, scoped to one class at a time
├── components/
│   └── require-role.tsx              Guards a page against direct URL access by the wrong role
└── lib/
    ├── api.ts                        fetch wrapper: attaches JWT, normalizes errors into ApiError
    ├── endpoints.ts                  All backend URL paths as typed constants (not hand-typed per page)
    ├── types.ts                      TypeScript types mirroring the backend's DTOs
    └── auth-context.tsx              React context: current user, login(), logout()
```

### Two layers of access control, mirroring the backend

1. **Sidebar nav filtering + `RequireRole`** — hides links and blocks
   direct URL access for the wrong role. This is a UX convenience, not a
   security boundary — anyone can still call the API directly with curl.
2. **The actual security boundary is the backend** — every request
   carries the JWT, and the API's `[Authorize(Roles = "...")]` attributes
   plus service-level ownership/enrollment checks are what actually
   enforce access. The frontend never trusts itself as the source of
   truth for what a user is allowed to do; it just tries to present a
   UI that doesn't offer actions the backend would reject anyway.

## Prerequisites

- Node.js 20+
- The backend API running and reachable (locally or deployed)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:5201/api
```

Point this at wherever the backend is actually running — a local
`dotnet run` instance, or a deployed URL (e.g. Render) if testing against
a live backend. Must include the `/api` suffix and have no trailing slash.

### 3. Run

```bash
npm run dev
```

Opens at `http://localhost:3000`. Log in with any of the backend's seeded
demo accounts (see the backend README) — the login screen displays the
three demo emails as a reminder.

## Responsive Design

The dashboard sidebar switches from a horizontal top bar (mobile, narrow
viewports) to a vertical sidebar (`md:` breakpoint and up) via Tailwind's
`flex md:flex-col` — no separate mobile/desktop component tree or
hamburger-menu state to maintain. Forms and tables use `flex-wrap` and
responsive `min-w-[...]` constraints rather than fixed-width layouts, so
they reflow on narrow screens instead of causing horizontal scroll.

## Form Validation

Every form uses a Zod schema shared between client-side validation and
the shape of the data sent to the API — field-level errors render inline
under each input via React Hook Form's `formState.errors`, and the same
schema's inferred TypeScript type keeps the `onSubmit` payload correctly
typed against what the backend DTO actually expects. Server-side
validation errors (e.g. "email already registered", "not assigned to
teach this class") surface separately, read from the backend's
`ExceptionHandlingMiddleware` JSON error shape via the `ApiError` class
in `lib/api.ts`.

## Deployment (Vercel)

1. Push to a Git repository, import into Vercel.
2. Set the `NEXT_PUBLIC_API_URL` environment variable in the Vercel
   project settings to your deployed backend's URL (e.g. the Render
   service URL + `/api`).
3. **The backend must allow your Vercel origin in its CORS policy** — set
   `Cors__AllowedOrigins__0` on the backend deployment to your exact
   Vercel URL (scheme, host, no trailing slash) or requests will fail
   with a CORS error despite both services running correctly
   independently. See the backend README's deployment notes.

## Known Limitations

- **JWT in `localStorage`, not an httpOnly cookie** — simplest approach
  for an assessment/demo scope, but vulnerable to XSS reading the token
  in a way an httpOnly cookie wouldn't be. A production version would
  move to cookie-based auth with the backend setting the cookie directly.
- **No client-side token refresh** — when the JWT expires (60 minutes by
  default on the backend), API calls start failing with 401 and the user
  has to log in again manually; there's no silent-refresh flow or
  expiry-aware redirect yet.
- **No toast/notification system** — success and error feedback is
  inline text (`<p className="text-red-600">`) per form, not a global
  notification component. Functional, not polished.
- **No pagination on any list view** — matches the backend's current lack
  of pagination; acceptable at the assessment's data scale.
- **Students see their grade by opening each assignment individually** —
  there's no single "My Grades" summary table across all assignments yet.
- **No automated frontend tests** — component/integration tests (e.g.
  React Testing Library) weren't in scope for this pass; the backend's
  business logic and authorization rules are covered by its own xUnit
  suite instead.
