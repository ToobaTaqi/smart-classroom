# Tasks: Project Scaffold and Toolchain

**Input**: Design documents from `/specs/01-scaffold/`
**Prerequisites**: `specs.md`, `plan.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)
- Every task names an exact file or command

## Phase 1: Setup

- [ ] T001 Initialize a Next.js App Router project with pnpm at the repository root, preserving `constitution.md`, `prompt.md`, `.specify/`, and `specs/`
- [ ] T002 Configure `tsconfig.json` with `strict: true`, path aliases, and no implicit `any`
- [ ] T003 [P] Install Tailwind CSS and create `tailwind.config.ts`, `postcss.config.mjs`, and global styles
- [ ] T004 [P] Initialize shadcn/ui with `components.json` and create `src/components/ui/` primitives used by the shell
- [ ] T005 [P] Install Recharts and add it to the dependency list without creating analytics screens yet
- [ ] T006 Add repository scripts in `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`
- [ ] T007 [P] Add `.gitignore` entries for `.env.local`, `.next/`, `node_modules/`, and coverage output

## Phase 2: Foundational

- [ ] T008 Create `src/lib/constants.ts` with `WEAK_TOPIC_THRESHOLD = 60`, `STRUGGLING_SUBJECT_THRESHOLD = 50`, `REVIEW_CONFIDENCE_THRESHOLD = 0.7`, `CHAT_DAILY_LIMIT_PER_STUDENT = 30`, `RETRIEVAL_TOP_K = 4`
- [ ] T009 Create `.env.example` with the nine required variables and `openai/gpt-oss-120b` defaults for the three model variables
- [ ] T010 Create `src/server/llm/client.ts` that imports `groq-sdk` and exports `generateStructured` and `chatWithTools` signatures; throw a clear configuration error when `GROQ_API_KEY` is absent
- [ ] T011 Create `scripts/check-llm.ts` that lists provider models and warns for each configured model that is missing
- [ ] T012 Create `supabase/migrations/` and a valid empty skeleton migration
- [ ] T013 [P] Configure Vitest in `vitest.config.ts` and add `tests/smoke.test.ts`

## Phase 3: User Story 1 - Runnable application shell (Priority: P1) 🎯 MVP

**Goal**: A developer can build, start, and browse the app shell.
**Independent Test**: `pnpm build` exits 0 and `pnpm dev` serves the landing page.

- [ ] T014 [US1] Create `src/app/layout.tsx` with metadata, global styles, and the shared shell header
- [ ] T015 [US1] Create `src/app/page.tsx` as a simple landing page with links to login, teacher, and student placeholders
- [ ] T016 [P] [US1] Create placeholder route files under `src/app/(auth)/`, `src/app/teacher/`, and `src/app/student/`
- [ ] T017 [US1] Create `src/app/not-found.tsx` with a friendly not-found message and a link home
- [ ] T018 [US1] Verify `pnpm build` and `pnpm dev` both succeed

## Phase 4: User Story 2 - Quality gates available from day one (Priority: P1)

**Goal**: Lint, typecheck, test, and build run from a clean checkout.
**Independent Test**: Run each required script and confirm no configuration errors.

- [ ] T019 [P] [US2] Configure ESLint for Next.js and TypeScript
- [ ] T020 [US2] Confirm `pnpm typecheck` uses `tsc --noEmit` and reports zero errors
- [ ] T021 [US2] Confirm `pnpm test` runs Vitest and the smoke test passes
- [ ] T022 [US2] Add a README placeholder documenting Node and pnpm versions and the required commands

## Phase 5: User Story 3 - Safe environment and provider wiring (Priority: P2)

**Goal**: Credentials are configured safely and the model check reports availability.
**Independent Test**: Run `scripts/check-llm.ts` with and without a configured model.

- [ ] T023 [US3] Verify `.env.example` contains exactly the nine constitution variables and no real values
- [ ] T024 [US3] Add a startup assertion that reports missing required variables by name without printing values
- [ ] T025 [US3] Run `scripts/check-llm.ts` against the provider and confirm it warns for a deliberately invalid model name
- [ ] T026 [US3] Inspect the production build output and confirm no client chunk imports `groq-sdk` or reads a service-role key

## Phase 6: Polish and Commit

- [ ] T027 [P] Remove unused starter assets and default template content
- [ ] T028 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`
- [ ] T029 Commit as `phase 0: scaffold`

## Dependencies & Execution Order

- Setup (T001–T007) has no dependencies.
- Foundational (T008–T013) depends on T001–T006.
- US1 (T014–T018) depends on Setup and Foundational.
- US2 (T019–T022) depends on T001–T006 and T013.
- US3 (T023–T026) depends on T010 and T011.
- Polish (T027–T029) depends on all prior tasks.

## Notes

- The migration skeleton must not create domain tables; each later phase owns its schema.
- The LLM client may be minimal in this phase, but it must be the only file importing `groq-sdk`.
- Commit only after all four quality commands pass.
