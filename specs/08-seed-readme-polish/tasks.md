# Tasks: Seed Data, Documentation, and Final Polish

**Input**: Design documents from `/specs/08-seed-readme-polish/`
**Prerequisites**: `specs.md`, `plan.md`, phases 01–07 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Create `PROGRESS.md` with a checklist for phases 0–7
- [ ] T002 [P] Create `DECISIONS.md` with one line per constitution-silent choice already made
- [ ] T003 [P] Confirm `scripts/check-llm.ts` from phase 01 still runs

## Phase 2: User Story 1 - One-command demo seed (Priority: P1) 🎯 MVP

**Goal**: A repeatable demo dataset exists.
**Independent Test**: Run the seed twice and sign in with every demo account.

- [ ] T004 [US1] Create `scripts/seed.ts` with environment checks and a service-role client
- [ ] T005 [US1] Upsert teacher@demo.test and student1..5@demo.test with password `Demo1234!`
- [ ] T006 [US1] Upsert profiles with names and roles
- [ ] T007 [US1] Upsert class `DEMO123` owned by the teacher
- [ ] T008 [US1] Upsert enrollments with roll numbers 1–5
- [ ] T009 [US1] Upsert the "Computer" subject
- [ ] T010 [US1] Create two sample markdown chapters and run them through the real parser and persistence helpers
- [ ] T011 [US1] Upsert an approved question bank with keys and rubrics for the seeded topics
- [ ] T012 [US1] Upsert one published test with relative dates so it stays open
- [ ] T013 [US1] Make every step idempotent and print created versus reused counts
- [ ] T014 [US1] Run the seed twice and verify zero duplicates

## Phase 3: User Story 2 - README that gets a new developer running (Priority: P1)

**Goal**: Setup is fully documented.
**Independent Test**: Follow the README from a clean checkout.

- [ ] T015 [US2] Write README prerequisites, install, and environment setup
- [ ] T016 [US2] Document `supabase start`, the `.env.local` fallback, and `npx inngest-cli@latest dev`
- [ ] T017 [US2] Document seeding and all demo accounts with password `Demo1234!`
- [ ] T018 [US2] Document the quality commands and the demo walkthrough
- [ ] T019 [US2] Verify no real secret appears in the README or repository

## Phase 4: User Story 3 - Required automated coverage (Priority: P1)

**Goal**: The six required areas have passing tests.
**Independent Test**: `pnpm test` passes and each area is present.

- [ ] T020 [P] [US3] Confirm `tests/parse-chapter.test.ts` covers the chapter parser and no-`##` warning
- [ ] T021 [P] [US3] Confirm `tests/test-import.test.ts` covers valid and invalid import markdown
- [ ] T022 [P] [US3] Confirm `tests/mcq-grader.test.ts` covers correct and incorrect MCQ grading
- [ ] T023 [P] [US3] Confirm `tests/mastery.test.ts` covers weighted updates and first-value behavior
- [ ] T024 [P] [US3] Confirm `tests/leaderboard.test.ts` covers the formula and tie-breaking
- [ ] T025 [P] [US3] Confirm `tests/llm-schemas.test.ts` covers valid and invalid LLM output
- [ ] T026 [US3] Fill any missing cases and ensure every test passes

## Phase 5: User Story 4 - RLS proof script (Priority: P1)

**Goal**: Isolation is proven or an environment limitation is recorded.
**Independent Test**: Run the script against a seeded instance.

- [ ] T027 [US4] Create `scripts/check-rls.ts` using the anon key and a student sign-in
- [ ] T028 [US4] Assert zero rows for another class's subjects and chapters
- [ ] T029 [US4] Assert zero rows for any student querying `question_keys`
- [ ] T030 [US4] Print PASS/FAIL per check and exit non-zero on failure
- [ ] T031 [US4] Handle an unreachable instance as a distinct environment error
- [ ] T032 [US4] If the instance is unreachable, record the limitation in `PROGRESS.md`

## Phase 6: User Story 5 - Demo-ready polish and end-to-end proof (Priority: P1)

**Goal**: The full demo works and the UI is polished.
**Independent Test**: Run the constitution's end-to-end demo with seed data.

- [ ] T033 [US5] Audit every page for loading, empty, and error states
- [ ] T034 [US5] Audit forms for labels, error messages, focus order, and keyboard use
- [ ] T035 [US5] Check mobile layouts for the class table, heatmap, test-taking, and assistant
- [ ] T036 [US5] Remove dead code and unused starter assets
- [ ] T037 [US5] Run the full demo: upload chapter, approve bank, join, practice, publish test, take test, grade, review, leaderboard, assistant confirmation
- [ ] T038 [US5] Update `PROGRESS.md` for every phase and `DECISIONS.md` for any new choice
- [ ] T039 [US5] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`

## Phase 7: Final Commit

- [ ] T040 Confirm no secret is tracked and no client bundle contains server-only code
- [ ] T041 Confirm every phase has a commit named `phase N: <summary>`
- [ ] T042 Commit as `phase 7: seed, docs, and polish`
- [ ] T043 Report what was built, how to run it, and anything incomplete

## Dependencies & Execution Order

- Setup (T001–T003) has no dependencies.
- US1 (T004–T014) depends on all prior phases.
- US2 (T015–T019) depends on US1 for accurate credentials.
- US3 (T020–T026) depends on phases 03–06 implementations.
- US4 (T027–T032) depends on a seeded instance.
- US5 (T033–T039) depends on every feature.
- Final commit (T040–T043) depends on all checks.

## Notes

- The seed must never be required for production and must never contain real secrets.
- A blocked RLS run is recorded, not hidden.
- The final demo is the acceptance test for the entire project.
