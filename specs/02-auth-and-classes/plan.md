# Implementation Plan: Authentication and Classes

**Branch**: `02-auth-and-classes` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/02-auth-and-classes/specs.md`

## Summary

Add Supabase Auth with role-bearing profiles, teacher-owned classes with unique join codes, student enrollment with sequential roll numbers, and a real-time notification bell. This phase establishes the tenancy and identity boundary that every later feature relies on.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20 LTS or newer
**Primary Dependencies**: Next.js App Router, `@supabase/supabase-js`, `@supabase/ssr`, shadcn/ui, Zod, Tailwind CSS
**Storage**: Supabase Postgres with Row-Level Security
**Testing**: Vitest for pure helpers and schema validation; SQL checks for RLS via `scripts/check-rls.ts` later
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Auth redirects resolve without a flash of protected content; bell updates within five seconds of insertion
**Constraints**: Service-role key only in server code; no custom auth; no email notifications; no additional roles
**Scale/Scope**: One class per teacher at minimum; multiple students; two roles

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| RLS on every table | PASS | Policies planned for `profiles`, `classes`, `enrollments`, `notifications` |
| Service-role isolation | PASS | Server actions and route handlers only; no client import |
| Two roles only | PASS | Enum `student|teacher` |
| Join codes | PASS | Unique column plus generator |
| Realtime notifications | PASS | Supabase Realtime subscription filtered by `user_id` |
| Simplicity | PASS | Supabase Auth rather than a custom identity system |

## Project Structure

### Documentation (this feature)

```text
specs/02-auth-and-classes/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/app/(auth)/
├── login/page.tsx
├── signup/page.tsx
└── join/page.tsx
src/app/teacher/
├── layout.tsx
├── page.tsx
└── classes/[classId]/page.tsx
src/app/student/
├── layout.tsx
└── page.tsx
src/app/api/
└── notifications/route.ts
src/lib/
├── supabase/client.ts
├── supabase/server.ts
├── supabase/middleware.ts
└── schemas/auth.ts
src/server/
└── notifications/notify.ts
src/components/
├── notification-bell.tsx
└── ui/...
src/middleware.ts
supabase/migrations/
├── 0002_profiles.sql
├── 0003_classes.sql
├── 0004_enrollments.sql
└── 0005_notifications.sql
tests/
└── join-code.test.ts
```

**Structure Decision**: Auth pages live in a route group so they share a layout without a dashboard shell. Server-side Supabase clients are split into browser and server variants. All writes that need the service role stay in server actions or route handlers.

## Phase 0: Research and Decisions

1. Use Supabase Auth email/password for the MVP; no OAuth provider is added.
2. Create `profiles` with a database trigger on `auth.users` insert, carrying `full_name` and `role` from signup metadata.
3. Generate join codes as six uppercase alphanumeric characters, retrying on unique violation.
4. Assign roll numbers with a transactional `max(roll_number) + 1` per class, protected by the unique constraint so a race produces a retry rather than a duplicate.
5. Use Supabase Realtime `postgres_changes` filtered by `user_id = eq.<id>` for the bell.

## Phase 1: Design

### Data model

- `profiles`: `id` (pk, references `auth.users`), `full_name`, `role` enum, `created_at`.
- `classes`: `id`, `name`, `teacher_id`, `join_code` unique, `created_at`.
- `enrollments`: `id`, `class_id`, `student_id`, `roll_number`, `created_at`; unique `(class_id, roll_number)` and `(class_id, student_id)`.
- `notifications`: `id`, `user_id`, `type`, `title`, `body`, `link`, `read_at`, `created_at`.

### RLS policies

- `profiles`: user reads and updates their own row; teachers can read profiles of students enrolled in their classes for class lists.
- `classes`: teacher full access to owned rows; students read classes where they are enrolled.
- `enrollments`: teacher full access for owned classes; student reads own rows; student inserts only their own row via a server-validated join flow.
- `notifications`: user reads and updates only rows where `user_id = auth.uid()`; inserts happen through the server helper.

### Routes and flows

- `/signup`: role selector, name, email, password; server action creates the auth user with metadata and then the profile.
- `/login`: email/password; redirect by role.
- `/join`: join-code form; server action validates the code and creates the enrollment.
- `/teacher`: class list plus create-class form.
- `/teacher/classes/[classId]`: join code, student table, editable roll numbers.
- Bell: client component subscribes to Realtime and renders a popover list.

### Validation

Zod schemas in `src/lib/schemas/auth.ts` for signup, login, class creation, join, and roll-number edits.

## Complexity Tracking

No violations. The only deliberate addition is a database trigger for profiles, which is simpler than duplicating profile creation across every auth path.

## Risks and Mitigations

- **Auth/profile drift**: the trigger plus server action both reconcile, and a retry path repairs missing profiles.
- **Join-code collisions**: unique constraint plus bounded retry.
- **Roll-number races**: unique constraint plus transactional assignment and a friendly retry.
- **Realtime leakage**: subscription filters by `user_id` and RLS is enabled before the bell ships.
