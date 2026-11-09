# Tasks: Assignments, Schedule, and Assistant

**Input**: Design documents from `/specs/07-assignments-schedule-assistant/`
**Prerequisites**: `specs.md`, `plan.md`, phase 06 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Create `src/server/assistant/retrieval.ts` with `websearch_to_tsquery`, class and subject filters, top `RETRIEVAL_TOP_K`, and context trimming
- [ ] T002 [P] Create `src/server/assistant/prompts.ts` with the system prompt rules and citation format
- [ ] T003 [P] Create `src/server/assistant/tools.ts` with the allow-list and Zod argument schemas
- [ ] T004 [P] Create `src/server/assistant/audit.ts` and `src/server/assistant/pending.ts`
- [ ] T005 [P] Add daily-limit helper counting user messages for today

## Phase 2: Foundational

- [ ] T006 Create `supabase/migrations/0020_assignments.sql` with subject-scoped RLS
- [ ] T007 [P] Create `supabase/migrations/0021_assignment_completions.sql` with unique `(assignment_id, student_id)`
- [ ] T008 [P] Create `supabase/migrations/0022_exam_schedule.sql` with class-scoped RLS
- [ ] T009 [P] Create `supabase/migrations/0023_chat_messages.sql` with own-row policies
- [ ] T010 [P] Create `supabase/migrations/0024_pending_actions.sql` with own-row policies
- [ ] T011 [P] Create `supabase/migrations/0025_reminders.sql` and `0026_assistant_audit_log.sql`
- [ ] T012 Implement `chatWithTools` in `src/server/llm/client.ts` if not already complete
- [ ] T013 Create `inngest/reminder-cron.ts` on a five-minute schedule with transactional done-marking

## Phase 3: User Story 1 - Teacher posts assignments and students complete them (Priority: P1) 🎯 MVP

**Goal**: Assignments post, notify, display, and complete.
**Independent Test**: Post, notify, complete, and verify no duplicate completion.

- [ ] T014 [US1] Build `src/app/teacher/assignments/page.tsx` with create form and list
- [ ] T015 [US1] Implement assignment create with Zod validation and `assignment_posted` notifications
- [ ] T016 [US1] Show assignments to enrolled students and allow mark-done
- [ ] T017 [US1] Implement idempotent completion upsert with `done_at`

## Phase 4: User Story 2 - Teacher publishes an exam schedule (Priority: P1)

**Goal**: Exam entries are visible and changes notify.
**Independent Test**: Create and edit an entry; confirm student view and notifications.

- [ ] T018 [US2] Build `src/app/teacher/schedule/page.tsx` with class and subject selection
- [ ] T019 [US2] Implement create and edit exam entries with Zod validation
- [ ] T020 [US2] Send `exam_schedule_changed` to enrolled students on change
- [ ] T021 [US2] Show schedule entries to enrolled students only

## Phase 5: User Story 3 - Full student dashboard (Priority: P1)

**Goal**: One dashboard aggregates all student work and signals.
**Independent Test**: Load the dashboard with seeded data and verify every section.

- [ ] T022 [US3] Build `src/app/student/page.tsx` with upcoming tests, assignments, and exams ordered by date
- [ ] T023 [US3] Add notifications, subjects, rank, and weak topics with practice-now links
- [ ] T024 [US3] Add loading, empty, and error states for each section
- [ ] T025 [US3] Batch the dashboard queries to avoid N+1 reads

## Phase 6: User Story 4 - Grounded assistant with citations (Priority: P1)

**Goal**: Answers are grounded, cited, and safe.
**Independent Test**: Ask a covered and an uncovered question; verify citations and refusal to invent.

- [ ] T026 [US4] Build `src/app/student/assistant/page.tsx` with subject selection, history, and citations
- [ ] T027 [US4] Implement `src/app/api/assistant/route.ts` for a chat turn with Zod validation
- [ ] T028 [US4] Enforce the daily limit before calling the model
- [ ] T029 [US4] Assemble context under 1,500 tokens and include the last 6 messages
- [ ] T030 [US4] Cap answers at about 500 tokens
- [ ] T031 [US4] Store citations as JSON and render them as `[Chapter > Topic]`
- [ ] T032 [US4] Verify no retrieved or user text can override the system rules

## Phase 7: User Story 5 - Assistant tools with confirmation and audit (Priority: P1)

**Goal**: Only safe, confirmed, audited actions run.
**Independent Test**: Run `list_upcoming`, propose a practice set, confirm it, and inspect the audit log.

- [ ] T033 [US5] Implement `list_upcoming` as an immediate read-only tool
- [ ] T034 [US5] Implement `create_practice_set`, `set_reminder`, and `mark_notifications_read` as pending actions
- [ ] T035 [US5] Render confirm/cancel cards for pending actions
- [ ] T036 [US5] Implement `src/app/api/assistant/pending/[id]/route.ts` for confirm and reject with ownership checks
- [ ] T037 [US5] Execute confirmed tools idempotently and store the result
- [ ] T038 [US5] Audit every proposal, confirmation, rejection, and immediate call
- [ ] T039 [US5] Verify the tool set contains no grades, attempts, or leaderboard access

## Phase 8: User Story 6 - Reminders become notifications (Priority: P2)

**Goal**: Due reminders become one notification each.
**Independent Test**: Run the cron against due and future reminders.

- [ ] T040 [US6] Select due, not-done reminders and create `reminder` notifications
- [ ] T041 [US6] Mark reminders done in the same transaction
- [ ] T042 [US6] Verify repeated cron runs do not duplicate notifications

## Phase 9: Tests and Commit

- [ ] T043 [P] Add `tests/retrieval.test.ts` for filters, ranking, top 4, and context trimming
- [ ] T044 [P] Add `tests/assistant-tools.test.ts` for allow-list, args, and forbidden tools
- [ ] T045 [P] Add `tests/daily-limit.test.ts` for the 30-message boundary
- [ ] T046 Verify the assistant answers with citations and a write tool requires confirmation
- [ ] T047 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T048 Commit as `phase 6: assignments, schedule, and assistant`

## Dependencies & Execution Order

- Setup (T001–T005) depends on phase 03 chunks and phase 06 constants.
- Foundational (T006–T013) depends on Setup and phase 02 classes.
- US1 (T014–T017) depends on T006, T007.
- US2 (T018–T021) depends on T008.
- US3 (T022–T025) depends on US1, US2, phase 05/06 data.
- US4 (T026–T032) depends on T001, T002, T009, T012.
- US5 (T033–T039) depends on T003, T004, T010.
- US6 (T040–T042) depends on T011.
- Tests (T043–T048) depend on implementation.

## Notes

- Never expose `question_keys` or grading data to the assistant or its tools.
- Confirmation is a server check, not a UI-only state.
- The reminder cron must be idempotent.
