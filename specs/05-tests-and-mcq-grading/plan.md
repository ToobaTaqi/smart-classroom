# Implementation Plan: Tests and MCQ Grading

**Branch**: `05-tests-and-mcq-grading` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/05-tests-and-mcq-grading/specs.md`

## Summary

Add the full test lifecycle: four creation methods, draft-to-published transition with student notification, a single server-timed attempt with incremental answer saves, expiry auto-submit from both client and a five-minute cron, deterministic MCQ grading, and a results view that withholds answers until the test closes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js App Router, Supabase, Inngest, Zod, unified/remark-parse for import, shadcn/ui
**Storage**: Supabase Postgres; `tests`, `test_questions`, `attempts`, `answers`
**Testing**: Vitest for test-import parser, MCQ grader, deadline calculation, and result visibility
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Answer saves complete quickly enough for normal typing cadence; MCQ grading is synchronous at submit
**Constraints**: One attempt per student; server clock authoritative; no answer leakage; no LLM in MCQ grading
**Scale/Scope**: Tests of tens of questions; durations in minutes; one class at a time

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Deterministic MCQ grading | PASS | Option-index comparison only |
| Teacher control | PASS | Tests are always draft until published |
| One attempt | PASS | Unique `(test_id, student_id)` |
| Server-enforced timer | PASS | Deadline computed server-side; cron fallback |
| Answer secrecy | PASS | Test-take payload excludes key fields |
| RLS | PASS | Publisher owns tests; students read published tests for enrolled classes only |

## Project Structure

### Documentation (this feature)

```text
specs/05-tests-and-mcq-grading/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/server/tests/
├── import-markdown.ts     # test import parser + Zod schemas
├── build.ts               # pick, auto-pick, manual
├── deadline.ts            # server deadline calculation
└── grade-mcq.ts           # deterministic grading on submit
src/app/teacher/tests/
├── page.tsx
├── new/page.tsx
└── [testId]/page.tsx
src/app/student/tests/
├── page.tsx
├── [testId]/take/page.tsx
└── [testId]/result/page.tsx
src/app/api/tests/
├── route.ts
└── [testId]/
    ├── start/route.ts
    ├── answer/route.ts
    └── submit/route.ts
inngest/
└── auto-submit-expired.ts
supabase/migrations/
├── 0014_tests.sql
├── 0015_test_questions.sql
├── 0016_attempts.sql
└── 0017_answers.sql
tests/
├── test-import.test.ts
├── deadline.test.ts
└── results-visibility.test.ts
```

**Structure Decision**: Test logic is server-only and shared between route handlers, the take page, and the cron. The take page is a client component for the countdown and autosave, but every save and submit goes through a validated route handler.

## Phase 0: Research and Decisions

1. Parse test markdown into a structured draft using the exact syntax in the constitution. Validate question numbers, type, marks, topic, difficulty, options, answers, and rubric.
2. Auto-pick queries approved questions filtered by topic and difficulty, randomizes, and returns up to N with a shortfall message.
3. Start attempt is a server action or route handler that inserts with status `in_progress`; the unique constraint prevents a second attempt.
4. Deadline is computed on every read and submit as `min(started_at + duration_minutes, closes_at)`.
5. Answer saves upsert by `(attempt_id, question_id)` so retries are idempotent.
6. Submit sets `submitted_at`, refuses if now is past the deadline, grades MCQs, recomputes totals, and sets status `submitted` unless every answer is already graded, then `graded`.
7. Results query includes keys only when `now >= closes_at`.
8. The expiry cron queries in-progress attempts whose deadline is past and reuses the same submit service.

## Phase 1: Design

### Data model

- `tests`: `id`, `subject_id`, `title`, `duration_minutes`, `opens_at`, `closes_at`, `status` (`draft|published|closed`), `created_by`, `created_at`.
- `test_questions`: `id`, `test_id`, `question_id`, `position`, `marks`, `created_at`.
- `attempts`: `id`, `test_id`, `student_id`, `started_at`, `submitted_at`, `status` (`in_progress|submitted|graded`), `total_score`, `max_score`, `created_at`; unique `(test_id, student_id)`.
- `answers`: `id`, `attempt_id`, `question_id`, `response`, `score` numeric nullable, `graded_by` (`auto|ai|teacher`), `ai_confidence`, `ai_feedback`, `needs_review`, `created_at`.

### Flows

- **Build**: teacher selects questions from the approved bank, auto-picks, adds manual questions, or imports markdown. All paths write `test_questions` with positions and marks.
- **Publish**: validate at least one question and valid dates, set status `published`, notify enrolled students.
- **Take**: load the test without keys, start or resume the attempt, render a countdown from the server deadline, autosave answers, auto-submit at zero.
- **Submit**: reject late, grade MCQ, compute totals, set status.
- **Cron**: every 5 minutes, submit expired attempts idempotently.
- **Results**: show score and feedback; reveal keys only after `closes_at`.

### Validation

Zod schemas for test creation, import markdown, auto-pick input, answer save, and submit.

## Complexity Tracking

No violations. A shared submit service is justified because the client and cron must enforce identical rules.

## Risks and Mitigations

- **Clock skew**: the server deadline is returned to the client and used for display only; enforcement is server-side.
- **Double submit**: a conditional update on status makes submit idempotent.
- **Key leakage in take payload**: explicit column projection and a test that asserts keys are absent.
- **Import ambiguity**: the preview blocks save until every question has zero errors.
- **Question deletion after test creation**: deleting a question referenced by a test is blocked or soft-deleted.
