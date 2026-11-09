# Feature Specification: Project Scaffold and Toolchain

**Feature Branch**: `01-scaffold`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 0. Establish the runnable foundation every later feature depends on.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Runnable application shell (Priority: P1)

A developer clones the repository, installs dependencies, supplies environment variables, and starts the application. The browser shows a working Smart Classroom shell with a placeholder landing page and role-aware navigation targets.

**Why this priority**: Every later feature is built inside this shell. Without a passing build and dev server, nothing else can be delivered.

**Independent Test**: Run `pnpm install`, `pnpm build`, and `pnpm dev`. The build exits successfully and the dev server serves a page without runtime errors.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** `pnpm install` and `pnpm build` run, **Then** the production build completes with exit code 0.
2. **Given** `pnpm dev` is running, **When** the root URL is opened, **Then** a styled page renders and no server error appears.
3. **Given** an unknown route, **When** it is requested, **Then** a friendly not-found page is shown.

---

### User Story 2 - Quality gates available from day one (Priority: P1)

A developer can run linting, type checking, unit tests, and the production build before any feature work begins.

**Why this priority**: The quality bar is part of the definition of done. Gates must exist before code accumulates.

**Independent Test**: Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in a clean checkout. Each command completes without configuration errors.

**Acceptance Scenarios**:

1. **Given** the scaffold, **When** `pnpm typecheck` runs, **Then** strict TypeScript checks run over the project.
2. **Given** the scaffold, **When** `pnpm test` runs, **Then** Vitest starts and reports results.
3. **Given** the scaffold, **When** `pnpm lint` runs, **Then** ESLint completes with no errors.

---

### User Story 3 - Safe environment and provider wiring (Priority: P2)

A developer configures Supabase, Groq, and Inngest credentials through environment variables. A model-check script reports which LLM models are available and warns when a configured model is missing.

**Why this priority**: Later phases call external services. Secret handling and provider configuration must be correct before those calls exist.

**Independent Test**: Copy `.env.example` to `.env.local`, fill fake or real values, and run the model-check script. It lists available models or reports a clear configuration error without crashing the app.

**Acceptance Scenarios**:

1. **Given** `.env.example`, **When** it is inspected, **Then** it lists exactly the variables required by the constitution.
2. **Given** a configured model name that the provider does not expose, **When** the model-check script runs, **Then** it warns and names the missing model.
3. **Given** the repository, **When** git status is inspected, **Then** no real secret file is tracked.

---

### Edge Cases

- Environment variables are missing or malformed: the app must fail with a clear developer-facing message, not a blank screen.
- A developer runs commands with an unsupported Node or package-manager version: the scaffold documents required versions.
- The remote LLM model list cannot be fetched: the model-check script reports the failure and exits non-zero.
- A new contributor adds a component outside the agreed UI library: review rejects a custom design system.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain a working Next.js App Router application written in strict TypeScript.
- **FR-002**: The project MUST use pnpm as its package manager and expose scripts for `dev`, `build`, `start`, `lint`, `typecheck`, and `test`.
- **FR-003**: The UI MUST be styled with Tailwind CSS and primitives from shadcn/ui, with Recharts available for later analytics screens.
- **FR-004**: The project MUST include a Vitest configuration and at least one passing smoke test so the test command is proven.
- **FR-005**: The project MUST expose `src/lib/constants.ts` containing `WEAK_TOPIC_THRESHOLD = 60`, `STRUGGLING_SUBJECT_THRESHOLD = 50`, `REVIEW_CONFIDENCE_THRESHOLD = 0.7`, `CHAT_DAILY_LIMIT_PER_STUDENT = 30`, and `RETRIEVAL_TOP_K = 4`.
- **FR-006**: The repository MUST include `.env.example` with exactly `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `LLM_MODEL_GEN`, `LLM_MODEL_GRADING`, `LLM_MODEL_CHAT`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY`; the three model variables MUST default to `openai/gpt-oss-120b`.
- **FR-007**: The repository MUST include a Supabase migration skeleton under `supabase/migrations` that can be applied by the Supabase CLI.
- **FR-008**: The repository MUST include `src/server/llm/client.ts` as the only module that imports the Groq SDK, exposing `generateStructured` and `chatWithTools` signatures without any real feature prompt yet.
- **FR-009**: The repository MUST include `scripts/check-llm.ts`, which lists available provider models and warns when a configured model is absent.
- **FR-010**: The repository MUST enforce TypeScript strictness and MUST NOT allow `any` in application code.
- **FR-011**: The repository MUST ignore local environment files and build artifacts in version control.
- **FR-012**: The scaffold MUST document the required Node and pnpm versions in the repository README placeholder.

### Key Entities

- **Application shell**: The shared layout, navigation targets, and styling baseline used by teacher and student surfaces.
- **Configuration**: The set of environment variables and constants that every module reads.
- **LLM client boundary**: The single server-only gateway through which all model calls will pass.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A clean checkout reaches a passing production build in a single documented command sequence.
- **SC-002**: All six required package scripts exist and run without configuration errors.
- **SC-003**: 100% of the five required constants are present with exactly the specified values.
- **SC-004**: 100% of the nine required environment variables appear in `.env.example` with no real secret values.
- **SC-005**: A smoke test passes under Vitest.
- **SC-006**: No client bundle contains server-only credentials or the LLM provider SDK.
