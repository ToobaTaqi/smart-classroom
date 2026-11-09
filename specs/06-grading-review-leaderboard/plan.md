# Implementation Plan: Grading Review, Leaderboard, and Class Analytics

**Branch**: `06-grading-review-leaderboard` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/06-grading-review-leaderboard/specs.md`

## Summary

Add AI short-answer grading with confidence and retry rules, a teacher review and override queue, deterministic recomputation of totals, mastery, and leaderboard, a class-scoped leaderboard view, and the teacher class table, heatmap, and student detail analytics.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js App Router, Supabase, Inngest, Groq through the shared LLM client, Zod, Recharts, shadcn/ui
**Storage**: Supabase Postgres; existing `answers`, `attempts`, `topic_mastery`, `questions`, `question_keys`; new `leaderboard` view
**Testing**: Vitest for mastery replay, leaderboard formula, tie-breaking, and grader schema
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Review queue and class analytics load in under two seconds for the demo dataset; leaderboard computes on read
**Constraints**: Concurrency 1 for grading; no caching; no LLM access to grades or leaderboard; keys readable only by teachers
**Scale/Scope**: One class with tens of students; tens of topics; tens of graded attempts

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Grader contract | PASS | Structured output `{ score, feedback <= 40 words, confidence 0..1 }` |
| Confidence threshold | PASS | `REVIEW_CONFIDENCE_THRESHOLD = 0.7` |
| Retry policy | PASS | 3 retries with exponential backoff including 429 |
| Teacher control | PASS | Accept or override with `graded_by = teacher` |
| Formula fidelity | PASS | Mastery `a = 0.3`; leaderboard formula exact |
| No caching | PASS | Leaderboard read directly from the view |
| RLS | PASS | Class-scoped leaderboard fields; own detailed rows |

## Project Structure

### Documentation (this feature)

```text
specs/06-grading-review-leaderboard/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/server/
├── grading/
│   ├── short-answer.ts      # prompt, schema, retry, save result
│   └── recompute.ts         # totals, mastery replay, leaderboard invalidation
├── analytics/
│   ├── mastery.ts           # existing weighted update + replay
│   ├── class-overview.ts    # student table and weak-topic counts
│   └── student-detail.ts
src/app/teacher/
├── review/page.tsx
├── classes/[classId]/page.tsx
├── subjects/[subjectId]/heatmap/page.tsx
└── students/[studentId]/page.tsx
src/app/student/leaderboard/page.tsx
inngest/
└── short-answer-grade.ts
supabase/migrations/
├── 0018_graded_at.sql
└── 0019_leaderboard_view.sql
tests/
├── leaderboard.test.ts
├── mastery-replay.test.ts
└── short-answer-schema.test.ts
```

**Structure Decision**: Grading and recomputation are server-only services shared by the Inngest job, the review action, and analytics reads. The leaderboard is a SQL view so the formula stays in one place.

## Phase 0: Research and Decisions

1. Use the LLM client's `generateStructured` with a Zod schema for the grader. Retry once on invalid JSON; retry 429/5xx with exponential backoff up to 3 total attempts.
2. Clamp nothing silently: reject out-of-range scores and flag the answer for review.
3. Add `graded_at` to `attempts` to make "earlier last-graded time" precise. It is set when the attempt becomes `graded` or when an override causes full grading.
4. Recompute mastery for affected student-topic pairs by replaying graded evidence in chronological order: practice answers contribute `a = 0.1`, graded test answers contribute `a = 0.3` with per-topic percentages. This keeps overrides deterministic.
5. Build the `leaderboard` view with a CTE that filters `attempts.status = 'graded'`, computes average test percentage and count per student, applies the formula, and ranks with `row_number()` ordered by points desc and last graded time asc.
6. Status transitions: `submitted` on submit; `graded` when no answer has a null score.
7. Notification `test_graded` is sent when an attempt transitions to `graded`, and when an override changes a graded attempt's score.

## Phase 1: Design

### Grading flow

1. On submit, MCQ answers are graded and short answers remain null.
2. The submit service enqueues `short-answer.grade` per short answer with concurrency 1.
3. Each job loads the question, key, rubric, marks, and response, calls the grader, validates output, and writes score, confidence, feedback, and `needs_review`.
4. After each write, check whether every answer has a score; if yes, set attempt `graded`, set `graded_at`, update mastery with `a = 0.3`, and notify `test_graded`.
5. On exhausted retries, write null score and `needs_review = true`.

### Review flow

1. Review queue lists answers where `needs_review = true`, joined to question, key, rubric, and student.
2. Accept keeps the AI score and clears the flag.
3. Override writes the teacher score, sets `graded_by = teacher`, clears the flag, and calls recompute.
4. Recompute totals, replays mastery for affected topics, and sets `graded_at` if newly complete.

### Analytics

- Class overview: enrollments joined to mastery and graded attempts; per-subject averages, overall average, rank from the leaderboard view, weak-topic count.
- Heatmap: students × topics with mastery score or empty.
- Student detail: subject averages, topic mastery bars, recent attempts.

### Leaderboard view

```sql
points = round(0.9 * avg_test_pct + least(10, 2 * graded_tests_count), 1)
rank = row_number() over (partition by class_id order by points desc, last_graded_at asc)
```

## Complexity Tracking

`graded_at` is added to `attempts` beyond the base entity list to make tie-breaking exact. Mastery replay is more work than an incremental update but is required for overrides to be correct.

## Risks and Mitigations

- **Provider failure**: null score plus review flag preserves the workflow.
- **Prompt injection in answers**: the grader prompt explicitly treats responses as data and never as instructions.
- **Override drift**: one recompute service owns totals, mastery, and status.
- **Leaderboard staleness**: no cache; computed on every read.
- **N+1 analytics queries**: fetch class data in batch and shape in memory.
