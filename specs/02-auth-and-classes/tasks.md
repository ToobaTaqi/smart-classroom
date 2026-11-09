# Tasks: Authentication and Classes

**Input**: Design documents from `/specs/02-auth-and-classes/`
**Prerequisites**: `specs.md`, `plan.md`, phase 01 complete

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)

## Phase 1: Setup

- [ ] T001 Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] T002 Create `src/lib/supabase/client.ts` for browser use
- [ ] T003 [P] Create `src/lib/supabase/server.ts` for server components, actions, and route handlers
- [ ] T004 [P] Create `src/lib/supabase/middleware.ts` and `src/middleware.ts` to refresh sessions and protect routes
- [ ] T005 [P] Add Zod schemas in `src/lib/schemas/auth.ts` for signup, login, class creation, join, and roll-number edits

## Phase 2: Foundational

- [ ] T006 Create `supabase/migrations/0002_profiles.sql` with the `role` enum, `profiles` table, RLS, and the `auth.users` trigger
- [ ] T007 [P] Create `supabase/migrations/0003_classes.sql` with `classes`, unique `join_code`, and ownership RLS
- [ ] T008 [P] Create `supabase/migrations/0004_enrollments.sql` with unique constraints and class-scoped RLS
- [ ] T009 [P] Create `supabase/migrations/0005_notifications.sql` with `notifications` and user-scoped RLS
- [ ] T010 Implement `src/server/notifications/notify.ts` that inserts one notification row per recipient using the service role
- [ ] T011 Add a join-code generator helper with unique-violation retry

## Phase 3: User Story 1 - Account creation and sign-in with a role (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, sign in, and reach the correct dashboard.
**Independent Test**: Create a student and a teacher, sign in as each, and confirm routing and signed-out redirects.

- [ ] T012 [US1] Build `src/app/(auth)/signup/page.tsx` with role selection, name, email, and password
- [ ] T013 [US1] Implement the signup server action that creates the auth user with `full_name` and `role` metadata, then reconciles the profile
- [ ] T014 [US1] Build `src/app/(auth)/login/page.tsx` and the login server action with role-based redirect
- [ ] T015 [US1] Add sign-out and the signed-in user indicator to the shared shell
- [ ] T016 [US1] Add route guards so `/teacher/*` requires a teacher and `/student/*` requires a student
- [ ] T017 [US1] Add a friendly error state for invalid credentials and failed signup

## Phase 4: User Story 2 - Teacher creates a class and shares a join code (Priority: P1)

**Goal**: A teacher can create classes and see their join codes.
**Independent Test**: Create a class and verify ownership and join-code uniqueness.

- [ ] T018 [US2] Build `src/app/teacher/page.tsx` with the class list and create-class form
- [ ] T019 [US2] Implement the create-class server action that assigns a unique join code
- [ ] T020 [US2] Build `src/app/teacher/classes/[classId]/page.tsx` showing the class name, join code, and copy control
- [ ] T021 [US2] Add a server-side ownership check for every class page and action

## Phase 5: User Story 3 - Student joins a class and gets a roll number (Priority: P1)

**Goal**: Students enroll by code and receive a sequential roll number.
**Independent Test**: Join a class, verify the roll number, then edit it as the teacher.

- [ ] T022 [US3] Build `src/app/(auth)/join/page.tsx` and the join server action
- [ ] T023 [US3] Assign the next sequential roll number inside a transaction and handle unique-violation retries
- [ ] T024 [US3] Prevent duplicate enrollment and return a clear message
- [ ] T025 [US3] Add the student table to the teacher class page with editable roll numbers
- [ ] T026 [US3] Implement the roll-number update server action with uniqueness validation

## Phase 6: User Story 4 - In-app notification bell with real time updates (Priority: P2)

**Goal**: Notifications appear live and can be marked read.
**Independent Test**: Insert a notification for a signed-in user and observe the bell update.

- [ ] T027 [US4] Build `src/components/notification-bell.tsx` with unread count and a popover list
- [ ] T028 [US4] Subscribe to Supabase Realtime changes filtered by `user_id`
- [ ] T029 [US4] Implement `src/app/api/notifications/route.ts` for list and mark-as-read
- [ ] T030 [US4] Verify the bell never receives rows for another user

## Phase 7: Verification and Commit

- [ ] T031 [P] Add `tests/join-code.test.ts` for code shape and collision retry behavior
- [ ] T032 Verify a student can join a class and receive a test notification
- [ ] T033 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T034 Commit as `phase 1: auth and classes`

## Dependencies & Execution Order

- Setup (T001–T005) has no dependencies.
- Foundational (T006–T011) depends on Setup.
- US1 (T012–T017) depends on T003, T004, T006.
- US2 (T018–T021) depends on T007 and US1.
- US3 (T022–T026) depends on T008, T011, US1, and US2.
- US4 (T027–T030) depends on T009 and T010.
- Verification (T031–T034) depends on all stories.

## Notes

- The service-role client is used only in server actions, route handlers, and `src/server`.
- The bell must be tested with a real inserted row, not only mocked data.
- Do not add email, push, or WhatsApp delivery in this phase.
