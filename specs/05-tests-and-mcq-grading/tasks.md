# Tasks: Tests and MCQ Grading

**Input**: Design documents from `/specs/05-tests-and-mcq-grading/`
**Prerequisites**: `specs.md`, `plan.md`, phase 04 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Create `src/server/tests/deadline.ts` with `min(started_at + duration_minutes, closes_at)`
- [ ] T002 [P] Create `src/server/tests/grade-mcq.ts` using the existing deterministic MCQ grader
- [ ] T003 [P] Define Zod schemas for test creation, auto-pick, answer save, and publish
- [ ] T004 [P] Create `src/server/tests/import-markdown.ts` for the exact test markdown syntax

## Phase 2: Foundational

- [ ] T005 Create `supabase/migrations/0014_tests.sql` with status enum and teacher/student RLS
- [ ] T006 [P] Create `supabase/migrations/0015_test_questions.sql` with ordering and marks
- [ ] T007 [P] Create `supabase/migrations/0016_attempts.sql` with unique `(test_id, student_id)` and statuses
- [ ] T008 [P] Create `supabase/migrations/0017_answers.sql` with grading fields and idempotent uniqueness
- [ ] T009 Create the shared submit service: reject late, grade MCQ, recompute totals, set status
- [ ] T010 Create the notification call for `test_published` on publish

## Phase 3: User Story 1 - Teacher builds a test (Priority: P1) 🎯 MVP

**Goal**: All four creation methods save a draft test.
**Independent Test**: Build one test with each method and inspect questions, marks, and draft status.

- [ ] T011 [US1] Build `src/app/teacher/tests/page.tsx` with a test list and `new` entry point
- [ ] T012 [US1] Build `src/app/teacher/tests/new/page.tsx` with the four creation tabs
- [ ] T013 [US1] Implement pick-from-bank selection with approved-only filtering
- [ ] T014 [US1] Implement auto-pick N by topic and difficulty with a shortfall message
- [ ] T015 [US1] Implement manual question entry and attachment to the test
- [ ] T016 [US1] Render the markdown import preview with per-question errors and block save on any error
- [ ] T017 [US1] Save imported questions as `approved` with source `import`
- [ ] T018 [US1] Implement test edit on `src/app/teacher/tests/[testId]/page.tsx`

## Phase 4: User Story 2 - Teacher publishes a test (Priority: P1)

**Goal**: Publishing validates and notifies.
**Independent Test**: Publish a test and confirm notification and date validation.

- [ ] T019 [US2] Validate at least one question and `closes_at` after `opens_at`
- [ ] T020 [US2] Implement the publish action and `test_published` notifications for enrolled students
- [ ] T021 [US2] Block student start before `opens_at` or after `closes_at`

## Phase 5: User Story 3 - Student takes a timed test (Priority: P1)

**Goal**: One timed attempt with incremental saves and enforced deadline.
**Independent Test**: Start, answer, autosave, and submit; verify late rejection and single attempt.

- [ ] T022 [US3] Build `src/app/student/tests/page.tsx` listing available tests and attempt state
- [ ] T023 [US3] Build `src/app/student/tests/[testId]/take/page.tsx` with countdown and question navigation
- [ ] T024 [US3] Implement `src/app/api/tests/[testId]/start/route.ts` with one-attempt enforcement
- [ ] T025 [US3] Implement `src/app/api/tests/[testId]/answer/route.ts` with idempotent upserts
- [ ] T026 [US3] Implement `src/app/api/tests/[testId]/submit/route.ts` using the shared submit service
- [ ] T027 [US3] Auto-submit on the client when the countdown reaches zero
- [ ] T028 [US3] Reject late submissions server-side even when the client is wrong
- [ ] T029 [US3] Exclude keys and rubrics from every take payload

## Phase 6: User Story 4 - Expiry cron auto-submits abandoned attempts (Priority: P2)

**Goal**: Expired in-progress attempts submit without a client.
**Independent Test**: Run the cron against expired and active attempts.

- [ ] T030 [US4] Create `inngest/auto-submit-expired.ts` on a five-minute cron
- [ ] T031 [US4] Query expired in-progress attempts and call the shared submit service
- [ ] T032 [US4] Make the submit service idempotent so cron and client cannot both win

## Phase 7: User Story 5 - MCQ grading and results (Priority: P1)

**Goal**: Submit produces scores and feedback, with keys gated by closing time.
**Independent Test**: Submit an MCQ test and view results before and after closing.

- [ ] T033 [US5] Grade MCQ answers on submit and recompute `total_score` and `max_score`
- [ ] T034 [US5] Set attempt status to `submitted`, or `graded` when every answer has a score
- [ ] T035 [US5] Build `src/app/student/tests/[testId]/result/page.tsx` with score and per-question feedback
- [ ] T036 [US5] Reveal correct answers only when `now >= closes_at`
- [ ] T037 [US5] Show a pending-grading state when short answers still have no score

## Phase 8: Tests and Commit

- [ ] T038 [P] Add `tests/test-import.test.ts` for valid, invalid, and duplicate question imports
- [ ] T039 [P] Add `tests/deadline.test.ts` for duration and closing-time precedence
- [ ] T040 [P] Add `tests/results-visibility.test.ts` for the answer-reveal rule
- [ ] T041 Verify an MCQ test is gradable end to end
- [ ] T042 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T043 Commit as `phase 4: tests and MCQ grading`

## Dependencies & Execution Order

- Setup (T001–T004) depends on phases 01 and 04.
- Foundational (T005–T010) depends on Setup and phase 04 questions.
- US1 (T011–T018) depends on T005, T006, and T004.
- US2 (T019–T021) depends on US1 and the notification helper.
- US3 (T022–T029) depends on T007, T008, T009, and US2.
- US4 (T030–T032) depends on T009.
- US5 (T033–T037) depends on T009 and US3.
- Tests (T038–T043) depend on implementation.

## Notes

- Short-answer grading is intentionally deferred to phase 06; this phase grades MCQ only.
- The cron and the client must call the same submit path.
- Never trust the client clock or client-supplied deadlines.
