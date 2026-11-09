# Feature Specification: Seed Data, Documentation, and Final Polish

**Feature Branch**: `08-seed-readme-polish`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 7, and section 13. Deliver demo data, setup documentation, the required test coverage, an RLS proof script, and final quality polish.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-command demo seed (Priority: P1)

A developer runs the seed script against a configured Supabase instance. It creates one teacher, one class with join code `DEMO123`, five students with roll numbers 1–5, a "Computer" subject with two markdown chapters, an approved question bank, and one published test.

**Why this priority**: The end-to-end demo and every reviewer depend on reproducible data.

**Independent Test**: Seed a fresh instance and sign in as each demo account.

**Acceptance Scenarios**:

1. **Given** a configured Supabase instance, **When** the seed script runs, **Then** teacher@demo.test, student1..5@demo.test, and the class `DEMO123` exist.
2. **Given** the seed, **When** the teacher signs in, **Then** they own the class, the Computer subject, two chapters, an approved bank, and one published test.
3. **Given** the seed, **When** a student signs in, **Then** they are enrolled with roll numbers 1–5.
4. **Given** every demo account, **When** it signs in with password `Demo1234!`, **Then** authentication succeeds.
5. **Given** the seed is run twice, **When** it completes, **Then** it does not create duplicate accounts, classes, or enrollments.

---

### User Story 2 - README that gets a new developer running (Priority: P1)

A new developer reads the README and can set up the project, configure environment variables, run Supabase and Inngest locally, seed data, and sign in with the demo accounts.

**Why this priority**: A project that cannot be run is not done.

**Independent Test**: Follow the README from a clean checkout and reach a working demo without outside help.

**Acceptance Scenarios**:

1. **Given** the README, **When** a developer follows the setup steps, **Then** they can run the app, database, and background jobs locally.
2. **Given** the README, **When** a developer looks for environment variables, **Then** the exact required list is documented.
3. **Given** the README, **When** a developer looks for demo credentials, **Then** all accounts and `Demo1234!` are listed.
4. **Given** the README, **When** a developer follows the seed step, **Then** the demo data appears.

---

### User Story 3 - Required automated coverage (Priority: P1)

The test suite covers the markdown chapter parser, test-import parser, MCQ grader, mastery update, leaderboard formula, and Zod schemas for LLM output.

**Why this priority**: These are the deterministic rules most likely to regress and the constitution's explicit quality bar.

**Independent Test**: Run `pnpm test` and confirm each required area has passing coverage.

**Acceptance Scenarios**:

1. **Given** the test suite, **When** it runs, **Then** the chapter parser has passing tests including the no-`##` warning and slug stability.
2. **Given** the test suite, **When** it runs, **Then** the test-import parser has passing tests for valid and invalid markdown.
3. **Given** the test suite, **When** it runs, **Then** the MCQ grader and mastery update have passing tests.
4. **Given** the test suite, **When** it runs, **Then** the leaderboard formula has passing tests for points and tie-breaking.
5. **Given** the test suite, **When** it runs, **Then** every LLM output schema has passing valid and invalid cases.

---

### User Story 4 - RLS proof script (Priority: P1)

A script proves that a student in another class, and any student querying `question_keys`, receives zero rows. If no Supabase instance is reachable, the script still exists and the limitation is recorded in `PROGRESS.md`.

**Why this priority**: Security is a core principle and needs an executable check, not a claim.

**Independent Test**: Run the script against a seeded instance and read the pass/fail output.

**Acceptance Scenarios**:

1. **Given** a seeded instance and a student from class A, **When** the script queries class B content, **Then** the row count is zero.
2. **Given** any signed-in student, **When** the script queries `question_keys`, **Then** the row count is zero.
3. **Given** the script runs without a reachable instance, **When** it exits, **Then** it reports the limitation clearly and does not silently pass.
4. **Given** the script output, **When** both checks pass, **Then** it exits successfully with a readable summary.

---

### User Story 5 - Demo-ready polish and end-to-end proof (Priority: P1)

Every page has loading, empty, and error states; layouts are responsive and mobile-friendly; forms are accessible; and the full demo scenario works with seed data.

**Why this priority**: The definition of done is the end-to-end demo, not isolated features.

**Independent Test**: Run the full demo scenario from the constitution with the seed accounts.

**Acceptance Scenarios**:

1. **Given** every page, **When** data is loading, empty, or failing, **Then** an appropriate state is shown.
2. **Given** a phone viewport, **When** the teacher and student flows are used, **Then** the layouts remain usable.
3. **Given** a form, **When** it is completed with a keyboard and screen reader, **Then** labels, errors, and focus order are correct.
4. **Given** the seed data, **When** the full demo runs, **Then** every step from chapter upload through assistant confirmation completes.
5. **Given** the repository, **When** `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run, **Then** all pass.

---

### Edge Cases

- The seed runs against a partially seeded database: it updates or skips rather than duplicating.
- The demo password is rejected by auth policy: the seed reports the policy error clearly.
- Supabase or Inngest is unavailable: the README documents the fallback and the app shows a clear configuration error.
- The RLS script cannot authenticate: it reports an auth failure separate from a policy failure.
- A page has no data for a new user: the empty state explains the next action.
- The demo test is already closed: dates in the seed keep it open relative to the seed run.
- A reviewer runs the app without Docker: the README explains using `.env.local` credentials instead of `supabase start`.
- Seed data contains no secrets and no real personal information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `scripts/seed.ts` MUST create one teacher `teacher@demo.test`.
- **FR-002**: The seed MUST create one class with join code `DEMO123` owned by the teacher.
- **FR-003**: The seed MUST create five students `student1@demo.test` through `student5@demo.test` with roll numbers 1 through 5.
- **FR-004**: The seed MUST create a "Computer" subject with two sample markdown chapters.
- **FR-005**: The seed MUST create an approved question bank and one published test.
- **FR-006**: All demo passwords MUST be `Demo1234!`.
- **FR-007**: The seed MUST be safe to run more than once without duplicate accounts, classes, or enrollments.
- **FR-008**: The README MUST cover setup, environment variables, running Supabase, running Inngest, seeding, and demo accounts.
- **FR-009**: Vitest MUST cover the markdown chapter parser, test-import parser, MCQ grader, mastery update, leaderboard formula, and LLM output Zod schemas.
- **FR-010**: `scripts/check-rls.ts` MUST prove zero rows for a student in another class and zero rows for any student querying `question_keys`.
- **FR-011**: If no Supabase instance is reachable, `PROGRESS.md` MUST record that the RLS script could not be run and why.
- **FR-012**: Every page MUST provide loading, empty, and error states.
- **FR-013**: The UI MUST be responsive, mobile-friendly, and accessible.
- **FR-014**: The repository MUST include a `DECISIONS.md` log with one line per constitution-silent choice.
- **FR-015**: `PROGRESS.md` MUST contain a checklist per phase and be updated as phases complete.
- **FR-016**: Each phase MUST end with a commit named `phase N: <summary>`.
- **FR-017**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` MUST all pass.
- **FR-018**: The full end-to-end demo in constitution section 13 MUST work with the seed data.

### Key Entities

- **Demo dataset**: The reproducible teacher, class, students, subject, chapters, questions, and test.
- **Quality evidence**: Test results, RLS output, lint, typecheck, and build results.
- **Project records**: `PROGRESS.md`, `DECISIONS.md`, and `README.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer reaches a running demo from a clean checkout in under 15 minutes using the README.
- **SC-002**: The seed creates exactly 1 teacher, 1 class, 5 students, 1 subject, 2 chapters, an approved bank, and 1 published test.
- **SC-003**: Running the seed twice produces zero duplicate accounts, classes, or enrollments.
- **SC-004**: 100% of the six required test areas have passing Vitest coverage.
- **SC-005**: The RLS script reports zero rows for both required isolation checks, or records an explicit environment limitation.
- **SC-006**: All four quality commands pass.
- **SC-007**: The full demo scenario completes without a manual database edit.
- **SC-008**: Every page has a visible loading, empty, and error state where data is involved.
