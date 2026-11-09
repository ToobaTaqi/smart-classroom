# Tasks: Subjects and Content Ingestion

**Input**: Design documents from `/specs/03-subjects-and-content/`
**Prerequisites**: `specs.md`, `plan.md`, phase 02 complete

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Install `unified` and `remark-parse`
- [ ] T002 [P] Create `src/server/ingest/types.ts` for parsed chapter, topic, chunk, and warning shapes
- [ ] T003 [P] Create `src/server/ingest/slug.ts` with deterministic slugification and duplicate suffixes
- [ ] T004 [P] Create `src/server/ingest/chunk.ts` with paragraph splitting and sentence-boundary fallback

## Phase 2: Foundational

- [ ] T005 Create `supabase/migrations/0006_subjects.sql` with `subjects` and class-scoped RLS
- [ ] T006 [P] Create `supabase/migrations/0007_chapters.sql` with `chapters`, status enum, version, and RLS
- [ ] T007 [P] Create `supabase/migrations/0008_topics.sql` with `topics` and unique `(chapter_id, slug)`
- [ ] T008 [P] Create `supabase/migrations/0009_chunks.sql` with `chunks`, generated `tsv`, and a GIN index
- [ ] T009 Create `src/server/ingest/parse-chapter.ts` that walks mdast, extracts title and topics, and builds chunks with heading paths
- [ ] T010 Create `inngest/client.ts` and `src/app/api/inngest/route.ts` to serve Inngest functions
- [ ] T011 Create the `chapter.uploaded` function in `inngest/chapter-uploaded.ts` with concurrency 1

## Phase 3: User Story 1 - Teacher creates subjects in a class (Priority: P1) 🎯 MVP

**Goal**: Subjects can be created and listed under an owned class.
**Independent Test**: Create a subject and verify teacher and enrolled-student visibility.

- [ ] T012 [US1] Add Zod schemas for subject create and update
- [ ] T013 [US1] Build `src/app/teacher/classes/[classId]/subjects/page.tsx` with subject list and create form
- [ ] T014 [US1] Implement the subject create server action with ownership validation
- [ ] T015 [US1] Show subjects on the student class view without edit controls

## Phase 4: User Story 2 - Chapter upload with parse preview (Priority: P1)

**Goal**: Teachers preview structure before saving.
**Independent Test**: Preview valid and invalid chapters and confirm warnings and errors.

- [ ] T016 [US2] Build `src/app/teacher/subjects/[subjectId]/page.tsx` with file upload and paste tabs
- [ ] T017 [US2] Implement the preview server action that returns parsed output without writing
- [ ] T018 [US2] Render chapter title, topics, chunk counts, heading paths, and warnings in the preview panel
- [ ] T019 [US2] Block save when the preview has fatal errors and require acknowledgement for the no-`##` warning
- [ ] T020 [US2] Implement the confirm action that creates the chapter with status `processing` and emits `chapter.uploaded`

## Phase 5: User Story 3 - Topics and chunks become the content index (Priority: P1)

**Goal**: Ingestion persists topics, chunks, and searchable text vectors.
**Independent Test**: Upload a long section and verify topics, chunk splits, heading paths, and full-text search.

- [ ] T021 [US3] Implement topic upsert by `(chapter_id, slug)` and position assignment
- [ ] T022 [US3] Implement chunk rebuild: delete old chunks for the chapter, insert new ones with denormalized ids
- [ ] T023 [US3] Set chapter status `ready` only after topics and chunks commit
- [ ] T024 [US3] Add full-text search helper using `websearch_to_tsquery` over `chunks`
- [ ] T025 [US3] Add topic tree and chunk counts to the teacher subject page

## Phase 6: User Story 4 - Re-upload replaces content without losing mastery (Priority: P2)

**Goal**: Re-uploads rebuild content and preserve topics by slug.
**Independent Test**: Create mastery data, re-upload with edited text, and confirm the topic id and history survive.

- [ ] T026 [US4] Increment `version` and set status `processing` on re-upload
- [ ] T027 [US4] Preserve topic ids for unchanged slugs and mark removed topics as no longer listed
- [ ] T028 [US4] Send `chapter_added` for first upload and `chapter_updated` for re-upload
- [ ] T029 [US4] Set status `failed` on ingestion error and keep the previous ready content readable

## Phase 7: User Story 5 - Students see chapters and topics (Priority: P2)

**Goal**: Enrolled students browse ordered content.
**Independent Test**: Enrolled student sees content; student in another class sees none.

- [ ] T030 [US5] Build `src/app/student/subjects/[subjectId]/page.tsx` with ordered chapters and topics
- [ ] T031 [US5] Add loading, empty, processing, failed, and error states
- [ ] T032 [US5] Verify RLS returns zero rows for a student outside the class

## Phase 8: Tests and Commit

- [ ] T033 [P] Add `tests/parse-chapter.test.ts` for title, topics, no-`##` warning, slug stability, and duplicate headings
- [ ] T034 [P] Add `tests/chunk.test.ts` for paragraph splitting, long-section splitting, and heading paths
- [ ] T035 Verify topics appear after upload and notifications reach enrolled students
- [ ] T036 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T037 Commit as `phase 2: subjects and content`

## Dependencies & Execution Order

- Setup (T001–T004) has no dependencies.
- Foundational (T005–T011) depends on Setup and phase 02.
- US1 (T012–T015) depends on T005 and phase 02 auth.
- US2 (T016–T020) depends on T009 and US1.
- US3 (T021–T025) depends on T006–T008 and T009.
- US4 (T026–T029) depends on T021–T023 and the notification helper.
- US5 (T030–T032) depends on US3 and phase 02 enrollment.
- Tests (T033–T037) depend on implementation.

## Notes

- Never call an LLM during ingestion.
- The preview must not write to the database.
- Chunks must retain `class_id` so retrieval can filter by membership without joins.
