# Implementation Plan: Project Scaffold and Toolchain

**Branch**: `01-scaffold` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/01-scaffold/specs.md`

## Summary

Create the fixed Next.js application shell and quality toolchain that every later phase builds on. The result is a strict TypeScript, pnpm-managed App Router project with Tailwind, shadcn/ui, Recharts, Vitest, ESLint, the five shared constants, the exact `.env.example`, a Supabase migration skeleton, the server-only LLM client boundary, and a provider model-check script.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20 LTS or newer
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, shadcn/ui, Recharts, `@supabase/supabase-js`, `groq-sdk`, `zod`, `unified`, `remark-parse`, Inngest
**Storage**: Supabase Postgres (local via Supabase CLI when Docker is available; otherwise `.env.local` credentials)
**Testing**: Vitest
**Target Platform**: Vercel (web) with Supabase backend
**Project Type**: Single web application
**Performance Goals**: Production build completes; landing page renders without server errors; no client bundle includes server-only code
**Constraints**: pnpm only; strict TypeScript; no `any`; no ORM; no embeddings or pgvector; secrets server-side only
**Scale/Scope**: One web app, two roles, eight build phases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| Fixed stack only | PASS | Next.js, pnpm, Tailwind, shadcn/ui, Recharts, Supabase, Inngest, Groq, Zod, unified/remark-parse, Vitest |
| Secrets server-side only | PASS | Only `.env.example` is committed; service-role and provider keys never imported by client code |
| Single LLM boundary | PASS | `src/server/llm/client.ts` is the only module allowed to import `groq-sdk` |
| Simplicity | PASS | No ORM, no embedding store, no custom design system, no extra services |
| Quality gates exist | PASS | `lint`, `typecheck`, `test`, `build` scripts created in this phase |

## Project Structure

### Documentation (this feature)

```text
specs/01-scaffold/
├── specs.md             # Feature specification
├── plan.md              # This file
└── tasks.md             # Executable task list
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/          # Placeholder auth group
│   ├── teacher/         # Placeholder teacher surface
│   ├── student/         # Placeholder student surface
│   ├── api/             # Route handlers (Inngest endpoint added in phase 3)
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
├── components/
│   └── ui/              # shadcn/ui primitives
├── lib/
│   └── constants.ts     # Five shared thresholds and limits
└── server/
    └── llm/
        └── client.ts    # Only module importing groq-sdk

supabase/
└── migrations/          # SQL migration skeleton

scripts/
└── check-llm.ts         # Provider model availability check

tests/
└── smoke.test.ts        # Proves Vitest is wired

.env.example
components.json
next.config.ts
package.json
pnpm-lock.yaml
postcss.config.mjs
tailwind.config.ts
tsconfig.json
vitest.config.ts
```

**Structure Decision**: A single Next.js application with server-only code isolated under `src/server`. The LLM boundary is created early so later phases cannot accidentally import the provider SDK from client code.

## Phase 0: Research and Decisions

1. Confirm the current Next.js App Router scaffolding command and pnpm compatibility.
2. Confirm the shadcn/ui initialization flow for Tailwind and TypeScript.
3. Confirm the Supabase CLI migration directory convention.
4. Confirm the Groq SDK model-list API and the exact model identifier `openai/gpt-oss-120b`.
5. Confirm Vitest setup for a Next.js TypeScript project without a browser environment.

All decisions are bounded by the constitution; no alternatives outside the fixed stack are considered.

## Phase 1: Design

- **Layout**: Root layout imports global styles and renders a minimal header with links to login, teacher, and student placeholders.
- **Constants**: `src/lib/constants.ts` exports the five numeric constants as `const` values.
- **Environment**: `.env.example` lists exactly the nine required variables; `.env.local` is git-ignored.
- **Database skeleton**: One empty-but-valid migration establishes the migration mechanism. Real tables arrive in their feature phases.
- **LLM client**: Define an interface with `generateStructured` and `chatWithTools`; implement configuration checks and a clear "not configured" error. Token logging and retries are added in the phase that first uses the client.
- **Model check**: `scripts/check-llm.ts` reads `GROQ_API_KEY` and the three model variables, requests the provider model list, prints available identifiers, and warns for each configured model that is absent.

## Complexity Tracking

No constitution violations. The scaffold intentionally stays minimal; no repositories, no domain models, and no extra packages.

## Risks and Mitigations

- **Provider SDK leakage into client bundles**: keep all imports under `src/server` and verify with a build inspection task.
- **Environment drift**: `.env.example` is the single documented list; scripts fail loudly when variables are missing.
- **Premature schema work**: the skeleton migration contains no domain tables so later phases own their own tables.
