# Tasks: Question Bank and Practice

**Input**: Design documents from `/specs/04-question-bank-and-practice/`
**Prerequisites**: `specs.md`, `plan.md`, phase 03 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Add `llm_usage` migration and token logging to `src/server/llm/client.ts`
- [ ] T002 [P] Add retry with exponential backoff for HTTP 429 and 5xx responses in the LLM client
- [ ] T003 [P] Implement `src/server/grading/mcq.ts` with deterministic option-index grading
- [ ] T004 [P] Implement `src/server/analytics/mastery.ts` with the `new = old * (1 - a) + pct * a` upsert and first-value behavior

## Phase 2: Foundational

- [ ] T005 Create `supabase/migrations/0010_questions.sql` with enums, table, and teacher/student policies
- [ ] T006 [P] Create `supabase/migrations/0011_question_keys.sql` with teacher-only RLS and no student policy
- [ ] T007 [P] Create `supabase/migrations/0012_practice_attempts.sql` with own-row policies
- [ ] T008 [P] Create `supabase/migrations/0013_topic_mastery.sql` with composite primary key and own-row policies
- [ ] T009 Create Zod schemas for generated MCQ, generated short answer, and the 6+3 generation envelope
- [ ] T010 Create `src/server/questions/generate.ts`: build a small prompt from topic chunks, call `generateStructured`, save drafts and keys
- [ ] T011 Create `inngest/bank-generate.ts` for `bank.generate` with concurrency 1 and one call per topic
- [ ] T012 Create `src/server/questions/select.ts` with unseen-first selection and session de-duplication

## Phase 3: User Story 1 - AI drafts a question bank per topic (Priority: P1) 🎯 MVP

**Goal**: Each ready topic receives 6 MCQ and 3 short drafts.
**Independent Test**: Ingest a chapter and inspect the bank per topic.

- [ ] T013 [US1] Emit `bank.generate` for every upserted topic after ingestion
- [ ] T014 [US1] Save generated questions as `draft` with source `ai` and keys in `question_keys`
- [ ] T015 [US1] Validate counts and difficulty mix; retry once on invalid output, then record failure
- [ ] T016 [US1] Record prompt and completion tokens per call in `llm_usage`
- [ ] T017 [US1] Skip generation for topics with no chunks and record the reason

## Phase 4: User Story 2 - Teacher reviews, edits, and bulk-approves questions (Priority: P1)

**Goal**: Teachers control what students see.
**Independent Test**: Approve one and bulk-approve several; students see only approved rows.

- [ ] T018 [US2] Build the question-bank section on `src/app/teacher/subjects/[subjectId]/page.tsx` grouped by topic with counts
- [ ] T019 [US2] Implement edit for prompt, options, marks, difficulty, and key fields
- [ ] T020 [US2] Implement single approve and atomic bulk approve server actions
- [ ] T021 [US2] Implement manual question creation with source `manual`
- [ ] T022 [US2] Verify student queries return only approved questions and zero key rows

## Phase 5: User Story 3 - Student practices a topic (Priority: P1)

**Goal**: Practice returns approved questions, grades MCQ instantly, grades short answers with AI, and updates mastery.
**Independent Test**: Answer MCQ and short practice questions and observe feedback and mastery changes.

- [ ] T023 [US3] Build `src/app/student/practice/page.tsx` with subject, topic, difficulty, and count controls
- [ ] T024 [US3] Build `src/app/student/practice/[sessionId]/page.tsx` with one-question-at-a-time flow
- [ ] T025 [US3] Implement `src/app/api/practice/route.ts` for start and submit with Zod validation
- [ ] T026 [US3] Grade MCQ server-side and return feedback without key data
- [ ] T027 [US3] Enqueue short-answer grading and mark the attempt as practice
- [ ] T028 [US3] Call `updateMastery` with weight 0.1 after each graded practice answer
- [ ] T029 [US3] Add loading, empty, and error states for practice

## Phase 6: User Story 4 - Request fresh questions when a topic runs dry (Priority: P2)

**Goal**: Students can request more drafts without bypassing review.
**Independent Test**: Exhaust a topic and confirm drafts are queued and not served.

- [ ] T030 [US4] Implement the unseen-approved counter per student and topic
- [ ] T031 [US4] Add the "fresh questions" button and server action with the `< 5` guard
- [ ] T032 [US4] Verify the guard prevents an LLM call at five or more unseen questions
- [ ] T033 [US4] Confirm new questions are drafts and appear in the teacher review view

## Phase 7: Tests and Commit

- [ ] T034 [P] Add `tests/mcq-grader.test.ts` for correct, incorrect, and invalid options
- [ ] T035 [P] Add `tests/mastery.test.ts` for first value, weighted update, and bounds
- [ ] T036 [P] Add `tests/llm-schemas.test.ts` for valid and invalid generation envelopes
- [ ] T037 Verify approved questions appear in practice and mastery changes after answering
- [ ] T038 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T039 Commit as `phase 3: question bank and practice`

## Dependencies & Execution Order

- Setup (T001–T004) depends on phase 01.
- Foundational (T005–T012) depends on Setup and phase 03 chunks.
- US1 (T013–T017) depends on T010–T012.
- US2 (T018–T022) depends on T005, T006, and US1.
- US3 (T023–T029) depends on T003, T004, T007, T008, T012.
- US4 (T030–T033) depends on US3 and US1.
- Tests (T034–T039) depend on implementation.

## Notes

- Never return `question_keys` fields in a student response.
- Concurrency 1 applies to generation and every LLM grading job.
- Practice mastery updates must not touch leaderboard inputs.
