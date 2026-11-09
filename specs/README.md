# Smart Classroom Specifications

Numbered by execution order. Each folder contains `specs.md` (what and why), `plan.md` (how), and `tasks.md` (ordered executable work).

| # | Folder | Phase | Depends on | Done when |
|---|--------|-------|------------|-----------|
| 01 | `01-scaffold` | 0 — Scaffold | — | `pnpm build` passes |
| 02 | `02-auth-and-classes` | 1 — Auth and classes | 01 | A student joins a class and receives a test notification |
| 03 | `03-subjects-and-content` | 2 — Subjects and content | 02 | Parser tests pass and topics appear after upload |
| 04 | `04-question-bank-and-practice` | 3 — Question bank and practice | 03 | Approved questions appear in practice and mastery changes after answering |
| 05 | `05-tests-and-mcq-grading` | 4 — Tests | 04 | An MCQ test is gradable end to end |
| 06 | `06-grading-review-leaderboard` | 5 — Grading, review, analytics | 05 | Low-confidence answers reach the queue and an override updates the leaderboard |
| 07 | `07-assignments-schedule-assistant` | 6 — Assignments, schedule, assistant | 06 | The assistant answers with citations and a write tool requires confirmation |
| 08 | `08-seed-readme-polish` | 7 — Seed, README, tests, polish | 07 | The full end-to-end demo works with seed data |

## Conventions

- `specs.md` follows the feature-spec structure: user scenarios, requirements, key entities, and measurable success criteria.
- `plan.md` records the technical approach, constitution gates, structure, and risks.
- `tasks.md` uses `T###` IDs and `[P]` for parallel-safe work.
- Every phase ends with `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, a `PROGRESS.md` update, and a commit named `phase N: <summary>`.
