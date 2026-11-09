# Implementation Plan: Seed Data, Documentation, and Final Polish

**Branch**: `08-seed-readme-polish` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/08-seed-readme-polish/specs.md`

## Summary

Finish the MVP with an idempotent demo seed, a complete README, the required Vitest coverage, an executable RLS proof script, project records, and end-to-end polish that makes the constitution's demo scenario work from seed data.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Existing stack only; seed uses `@supabase/supabase-js` with the service role; RLS script uses the anon key plus a student sign-in
**Storage**: Supabase Postgres
**Testing**: Vitest; RLS script run manually against an instance
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Seed completes in a reasonable time for local development; pages remain responsive on mobile
**Constraints**: No real secrets in seed or docs; demo passwords only; no new libraries
**Scale/Scope**: One teacher, one class, five students, one subject, two chapters, one test

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Demo credentials | PASS | `teacher@demo.test`, `student1..5@demo.test`, password `Demo1234!` |
| Join code | PASS | `DEMO123` |
| Seed contents | PASS | Teacher, class, students, Computer subject, 2 chapters, bank, 1 published test |
| Tests | PASS | Six required areas covered |
| RLS proof | PASS | `scripts/check-rls.ts` |
| Quality gates | PASS | lint, typecheck, test, build |
| Records | PASS | `PROGRESS.md`, `DECISIONS.md`, `README.md` |
| No secrets | PASS | Only demo passwords in documentation |

## Project Structure

### Documentation (this feature)

```text
specs/08-seed-readme-polish/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
scripts/
├── seed.ts
├── check-llm.ts        # created in phase 01
└── check-rls.ts
tests/
├── parse-chapter.test.ts
├── test-import.test.ts
├── mcq-grader.test.ts
├── mastery.test.ts
├── leaderboard.test.ts
└── llm-schemas.test.ts
README.md
PROGRESS.md
DECISIONS.md
```

**Structure Decision**: Seed and RLS checks are standalone TypeScript scripts run with `tsx` or the project's existing TypeScript runner. They use environment variables and never embed keys.

## Phase 0: Research and Decisions

1. Use the Supabase admin API to create auth users with `email_confirm: true`, then upsert profiles.
2. Make every seed write idempotent: look up by email, join code, class name, subject name, chapter position, and question prompt before inserting.
3. Seed relative dates so the published test stays open around the run time.
4. Seed chapters by calling the same parser and persistence helpers used by ingestion, so the demo data exercises real code.
5. Seed the approved bank directly with valid keys and rubrics to avoid depending on the LLM during seeding.
6. The RLS script signs in as a student with the anon key, queries another class's subjects and chapters, then queries `question_keys`; both must return zero rows.
7. Record any constitution-silent choice as one line in `DECISIONS.md` as it is made.

## Phase 1: Design

### Seed flow

1. Read Supabase URL, service-role key, and demo constants from the environment.
2. Upsert teacher and students.
3. Upsert profiles with roles and full names.
4. Upsert class `DEMO123`.
5. Upsert enrollments with roll numbers 1–5.
6. Upsert the "Computer" subject.
7. Parse and upsert two markdown chapters through the real ingestion helpers.
8. Upsert an approved question bank for the seeded topics.
9. Upsert one published test with relative dates.
10. Print a summary of created and reused rows.

### RLS script

1. Sign in as `student1@demo.test` using the anon key.
2. Query a class the student is not enrolled in; assert zero rows.
3. Query `question_keys`; assert zero rows.
4. Print PASS/FAIL per check and exit non-zero on failure.
5. If the instance is unreachable, print a distinct environment error and exit non-zero.

### Documentation

- README: prerequisites, install, env, Supabase, Inngest, seed, run, demo accounts, quality commands.
- PROGRESS: checklist per phase with status and notes.
- DECISIONS: one line per choice where the constitution was silent.

### Polish

- Audit every page for loading, empty, and error states.
- Audit forms for labels, error text, focus order, and keyboard use.
- Check mobile widths for the teacher class table, heatmap, test-taking, and assistant.
- Remove dead code and unused starter assets.

## Complexity Tracking

No violations. The seed script intentionally reuses ingestion code rather than duplicating parsing logic.

## Risks and Mitigations

- **Seed duplication**: idempotent lookups before every insert.
- **Auth policy rejection**: surface the Supabase error with the failing email and reason.
- **RLS false pass**: the script fails loudly when it cannot authenticate or reach the instance.
- **Demo drift**: seed dates are relative and the demo steps are documented.
- **Last-minute regressions**: run all four quality commands and the full demo before the final commit.
