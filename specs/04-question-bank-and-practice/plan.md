# Implementation Plan: Question Bank and Practice

**Branch**: `04-question-bank-and-practice` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/04-question-bank-and-practice/specs.md`

## Summary

Generate a reviewed question bank per topic through Inngest and the shared LLM client, expose teacher review and bulk approval, and add student practice with server-side MCQ feedback, LLM-graded short answers, and mastery updates that never affect the leaderboard.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js App Router, Supabase, Inngest, Groq through `src/server/llm/client.ts`, Zod, shadcn/ui
**Storage**: Supabase Postgres; `questions`, `question_keys`, `practice_attempts`, `topic_mastery`
**Testing**: Vitest for the MCQ grader, mastery update, and LLM output schemas
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: MCQ feedback under one second; generation is asynchronous and may take tens of seconds per topic
**Constraints**: Concurrency 1 for every LLM job; no embeddings; only approved questions to students; keys never leave the server
**Scale/Scope**: 9 questions per topic; practice sessions of a configurable count

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Teacher in control | PASS | All AI output is `draft` until approved |
| Keys hidden | PASS | `question_keys` with teacher-only RLS; grading uses the service role |
| LLM tokens scarce | PASS | One call per topic, bounded output, concurrency 1 |
| Structured output + Zod | PASS | Generation schema validated before insert |
| Mastery formula | PASS | `a = 0.1` per practice answer |
| Leaderboard isolation | PASS | Practice never writes leaderboard inputs |

## Project Structure

### Documentation (this feature)

```text
specs/04-question-bank-and-practice/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/server/
├── llm/client.ts              # generateStructured + token logging
├── grading/mcq.ts             # deterministic MCQ grader
├── analytics/mastery.ts       # updateMastery(studentId, topicId, pct, weight)
└── questions/
    ├── generate.ts            # prompt, schema, save drafts and keys
    └── select.ts              # practice selection with unseen preference
src/app/teacher/subjects/[subjectId]/page.tsx   # question bank review
src/app/student/practice/page.tsx
src/app/student/practice/[sessionId]/page.tsx
src/app/api/practice/route.ts
inngest/
├── bank-generate.ts
└── short-answer-grade.ts      # shared with phase 05
supabase/migrations/
├── 0010_questions.sql
├── 0011_question_keys.sql
├── 0012_practice_attempts.sql
└── 0013_topic_mastery.sql
tests/
├── mcq-grader.test.ts
├── mastery.test.ts
└── llm-schemas.test.ts
```

**Structure Decision**: Generation, selection, grading, and mastery are pure server modules so they can be unit-tested and reused by the test flow in phase 05.

## Phase 0: Research and Decisions

1. Use the LLM client's `generateStructured` with a Zod schema that enforces exactly 6 MCQ and 3 short questions. Reject and retry once on invalid output.
2. Prompt contains only the topic's chunks and the required output shape; never a whole chapter.
3. MCQ options are stored as a JSON array of `{ label, text }`; `correct_option` is an index in `question_keys`.
4. Practice selection orders unseen questions first, then randomizes, and limits by the requested count.
5. Short-answer practice grading reuses the same grader contract as tests, with a practice flag on the attempt.
6. Mastery update is a single SQL upsert using the formula from the constitution.

## Phase 1: Design

### Data model

- `questions`: `id`, `subject_id`, `topic_id`, `type` (`mcq|short`), `prompt`, `options` jsonb nullable, `max_marks`, `difficulty` (`easy|medium|hard`), `status` (`draft|approved`), `source` (`ai|manual|import`), `created_by`, `created_at`.
- `question_keys`: `question_id` pk, `correct_option` int nullable, `answer_key` text, `rubric` text.
- `practice_attempts`: `id`, `student_id`, `topic_id`, `question_id`, `response` text, `is_correct` bool, `created_at`.
- `topic_mastery`: `student_id`, `topic_id`, `score` numeric 0–100, `data_points` int, `updated_at`, pk `(student_id, topic_id)`.

### Policies

- Students read approved questions for enrolled classes; they never read `question_keys`.
- Teachers read and write questions and keys for owned classes.
- Students read and write only their own practice attempts and mastery rows.
- Grading and generation use the service role on the server.

### Generation contract

```text
Input: topic title, heading path, up to 4 relevant chunks
Output: { mcq: QuestionSchema[6], short: QuestionSchema[3] }
Each question: prompt, options (MCQ only, 4), correct_option (MCQ only), max_marks, difficulty, answer_key, rubric
```

### Practice flow

1. Student selects subject, topic, difficulty, count.
2. `selectPracticeQuestions` returns approved rows, preferring unseen.
3. MCQ submit calls `gradeMcq` server-side and records the attempt, then updates mastery.
4. Short submit enqueues grading through Inngest; the attempt is stored with `is_correct` pending, then mastery updates after grading.
5. The fresh-questions guard counts unseen approved rows for that student and only enqueues generation below 5.

## Complexity Tracking

No violations. The short-answer grader is introduced here because practice needs it, and phase 05 reuses the same job for tests.

## Risks and Mitigations

- **Invalid model output**: strict Zod schema, one retry, no partial insert.
- **Key leakage**: keys live in a separate table; API responses project question fields explicitly.
- **Practice starvation**: fresh-questions guard plus teacher review path.
- **Duplicate practice questions**: selection de-duplicates by question id within a session.
- **Rate limits**: concurrency 1 plus exponential backoff in the LLM client.
