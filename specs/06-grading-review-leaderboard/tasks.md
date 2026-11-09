# Tasks: Grading Review, Leaderboard, and Class Analytics

**Input**: Design documents from `/specs/06-grading-review-leaderboard/`
**Prerequisites**: `specs.md`, `plan.md`, phase 05 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Create `src/server/grading/short-answer.ts` with the grader prompt, Zod schema, and retry rules
- [ ] T002 [P] Implement exponential backoff for 3 attempts including HTTP 429 in the grading wrapper
- [ ] T003 [P] Create `src/server/grading/recompute.ts` for attempt totals, mastery replay, and status
- [ ] T004 [P] Add `graded_at timestamptz` to `attempts` in `supabase/migrations/0018_graded_at.sql`

## Phase 2: Foundational

- [ ] T005 [P] Create `supabase/migrations/0019_leaderboard_view.sql` with the exact points formula, rank, and tie-break
- [ ] T006 Create the `leaderboard` view policy strategy: students read class-scoped public fields only
- [ ] T007 Create `inngest/short-answer-grade.ts` with concurrency 1 and one job per short answer
- [ ] T008 Implement mastery replay in `src/server/analytics/mastery.ts` for overrides and recomputation
- [ ] T009 Create `src/server/analytics/class-overview.ts` with per-subject averages, overall average, rank, and weak-topic count
- [ ] T010 [P] Create `src/server/analytics/student-detail.ts` with subject averages, topic mastery, and recent attempts

## Phase 3: User Story 1 - Short answers are AI-graded with confidence (Priority: P1) 🎯 MVP

**Goal**: Short answers receive validated scores, feedback, confidence, and review flags.
**Independent Test**: Submit a clear and an ambiguous answer and compare confidence and review flags.

- [ ] T011 [US1] Enqueue short-answer grading after test submit
- [ ] T012 [US1] Build the grader prompt from question, key, rubric, max marks, and response only
- [ ] T013 [US1] Validate `{ score, feedback, confidence }` with Zod; reject out-of-range values
- [ ] T014 [US1] Set `needs_review` when confidence is below `REVIEW_CONFIDENCE_THRESHOLD`
- [ ] T015 [US1] On exhausted retries, store null score and set `needs_review`
- [ ] T016 [US1] Mark the attempt `graded` only when no answer has a null score
- [ ] T017 [US1] Set `graded_at` on the transition to `graded`
- [ ] T018 [US1] Update test mastery with `a = 0.3` and create the `test_graded` notification

## Phase 4: User Story 2 - Teacher reviews and overrides flagged answers (Priority: P1)

**Goal**: Flagged answers can be accepted or overridden with full recomputation.
**Independent Test**: Override a score and verify total, mastery, leaderboard, and notification.

- [ ] T019 [US2] Build `src/app/teacher/review/page.tsx` with question, key, rubric, response, AI score, feedback, and confidence
- [ ] T020 [US2] Implement accept action that clears `needs_review` without changing the score
- [ ] T021 [US2] Implement override action with Zod-validated score within `0..max_marks`
- [ ] T022 [US2] Set `graded_by = teacher` on override and clear the review flag
- [ ] T023 [US2] Call recompute after accept or override and make it idempotent
- [ ] T024 [US2] Verify an override updates totals, mastery, and leaderboard
- [ ] T025 [US2] Send `test_graded` when an override changes a graded result

## Phase 5: User Story 3 - Class-scoped leaderboard (Priority: P2)

**Goal**: Students see correct points and rank for their class.
**Independent Test**: Create graded attempts and compare points, ordering, ties, top 10, and own rank.

- [ ] T026 [US3] Implement the leaderboard view with `round(0.9 * avg_test_pct + least(10, 2 * graded_tests_count), 1)`
- [ ] T027 [US3] Rank by points descending and earlier `graded_at` ascending
- [ ] T028 [US3] Build `src/app/student/leaderboard/page.tsx` with top 10 and own rank
- [ ] T029 [US3] Show only rank, name, and points to students
- [ ] T030 [US3] Verify no cache and no cross-class rows

## Phase 6: User Story 4 - Teacher class view and heatmap (Priority: P2)

**Goal**: Teachers see per-student performance and mastery.
**Independent Test**: Populate data and verify the class table, heatmap, and student detail.

- [ ] T031 [US4] Add the student table to `src/app/teacher/classes/[classId]/page.tsx`
- [ ] T032 [US4] Compute per-subject average, overall average, rank, and weak-topic count
- [ ] T033 [US4] Build `src/app/teacher/subjects/[subjectId]/heatmap/page.tsx` with students × topics cells
- [ ] T034 [US4] Render empty cells for missing mastery instead of zero
- [ ] T035 [US4] Build `src/app/teacher/students/[studentId]/page.tsx` with subject averages, mastery bars, and recent attempts
- [ ] T036 [US4] Mark subjects below `STRUGGLING_SUBJECT_THRESHOLD` as struggling

## Phase 7: Tests and Commit

- [ ] T037 [P] Add `tests/leaderboard.test.ts` for the formula, ordering, ties, and top-10 behavior
- [ ] T038 [P] Add `tests/mastery-replay.test.ts` for test weight 0.3, practice weight 0.1, and first-value behavior
- [ ] T039 [P] Add `tests/short-answer-schema.test.ts` for range, feedback length, and confidence validation
- [ ] T040 Verify low-confidence answers reach the queue and an override updates the leaderboard
- [ ] T041 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T042 Commit as `phase 5: grading review and leaderboard`

## Dependencies & Execution Order

- Setup (T001–T004) depends on phase 05 answers and attempts.
- Foundational (T005–T010) depends on Setup and phase 04/05 data.
- US1 (T011–T018) depends on T001–T004 and T007.
- US2 (T019–T025) depends on US1 and T003.
- US3 (T026–T030) depends on T005 and graded attempts.
- US4 (T031–T036) depends on T009, T010, and US3 rank data.
- Tests (T037–T042) depend on implementation.

## Notes

- The grader never sees or writes leaderboard data.
- Recompute must be safe to run repeatedly.
- The leaderboard formula must exist in exactly one place: the SQL view.
