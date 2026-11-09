---
id: 002
title: Create Numbered Spec Folders
stage: spec
date: 2026-11-09
surface: agent
model: Big Pickle
feature: smart-classroom-mvp
branch: main
user: USER
command: /sp.specify
labels: ["specs", "plan", "tasks", "smart-classroom", "build-order"]
links:
  spec: specs/README.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/README.md
  - specs/01-scaffold/specs.md
  - specs/01-scaffold/plan.md
  - specs/01-scaffold/tasks.md
  - specs/02-auth-and-classes/specs.md
  - specs/02-auth-and-classes/plan.md
  - specs/02-auth-and-classes/tasks.md
  - specs/03-subjects-and-content/specs.md
  - specs/03-subjects-and-content/plan.md
  - specs/03-subjects-and-content/tasks.md
  - specs/04-question-bank-and-practice/specs.md
  - specs/04-question-bank-and-practice/plan.md
  - specs/04-question-bank-and-practice/tasks.md
  - specs/05-tests-and-mcq-grading/specs.md
  - specs/05-tests-and-mcq-grading/plan.md
  - specs/05-tests-and-mcq-grading/tasks.md
  - specs/06-grading-review-leaderboard/specs.md
  - specs/06-grading-review-leaderboard/plan.md
  - specs/06-grading-review-leaderboard/tasks.md
  - specs/07-assignments-schedule-assistant/specs.md
  - specs/07-assignments-schedule-assistant/plan.md
  - specs/07-assignments-schedule-assistant/tasks.md
  - specs/08-seed-readme-polish/specs.md
  - specs/08-seed-readme-polish/plan.md
  - specs/08-seed-readme-polish/tasks.md
tests:
  - none
---

## Prompt

make a specs folder and and make every specs folder with the name and number which sequence it should be executed. /specs/[01+specs-name]/specs.md+plan.md+tasks.md

## Response snapshot

Created eight numbered spec folders in execution order, each containing `specs.md`, `plan.md`, and `tasks.md`, plus a `specs/README.md` index. The sequence mirrors the constitution's build phases 0–7: scaffold, auth and classes, subjects and content, question bank and practice, tests and MCQ grading, grading/review/leaderboard, assignments/schedule/assistant, and seed/README/polish. Every spec preserves the constitution's thresholds, formulas, enums, routes, and acceptance targets.

## Outcome

- ✅ Impact: The MVP is decomposed into eight independently buildable, testable phases with concrete requirements, technical plans, and ordered tasks.
- 🧪 Tests: None run (specification documents only).
- 📁 Files: 25 Markdown files under `specs/`.
- 🔁 Next prompts: Start implementation at `specs/01-scaffold/tasks.md` (Phase 0).
- 🧠 Reflection: Naming folders by execution order keeps the build sequence obvious. Each plan carries a constitution gate table so later implementation cannot drift from the fixed stack.

## Evaluation notes (flywheel)

- Failure modes observed: One requirement line was initially written as a task checkbox; corrected to a plain requirement.
- Graders run and results (PASS/FAIL): Structure check PASS; all 8 folders have 3 files PASS; no unresolved placeholders PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Execute the Phase 0 task list and validate `pnpm build`.
