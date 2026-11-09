# Implementation Plan: Subjects and Content Ingestion

**Branch**: `03-subjects-and-content` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/03-subjects-and-content/specs.md`

## Summary

Add class-scoped subjects, deterministic markdown chapter parsing, a preview step, topic and chunk persistence with full-text search, replace-on-reupload semantics, and Inngest-driven ingestion that notifies enrolled students.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js App Router, Supabase, Inngest, `unified`, `remark-parse`, Zod, shadcn/ui
**Storage**: Supabase Postgres; `tsvector` plus GIN index; no embeddings or pgvector
**Testing**: Vitest for parser, slugging, chunking, and heading-path behavior
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Preview renders for a normal chapter in under two seconds; full-text search under one second for the demo dataset
**Constraints**: Deterministic parsing only; no LLM in ingestion; no frontmatter; prompts must never receive whole chapters
**Scale/Scope**: A handful of subjects per class; chapters up to a few thousand words; chunks small enough for retrieval

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Deterministic parsers | PASS | `unified` + `remark-parse`, no LLM in ingestion |
| No embeddings | PASS | `tsvector` + GIN + `websearch_to_tsquery` |
| RLS | PASS | Subject, chapter, topic, and chunk policies scoped by class membership |
| Notification types | PASS | `chapter_added` and `chapter_updated` only |
| Mastery survives re-upload | PASS | Topic matching by stable slug |
| Simplicity | PASS | No custom markdown dialect, no version history table |

## Project Structure

### Documentation (this feature)

```text
specs/03-subjects-and-content/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/server/ingest/
├── parse-chapter.ts     # markdown -> chapter + topics + chunks
├── slug.ts              # deterministic slug + duplicate handling
├── chunk.ts             # paragraph and sentence splitting
└── types.ts
src/app/teacher/classes/[classId]/subjects/page.tsx
src/app/teacher/subjects/[subjectId]/page.tsx
src/app/student/subjects/[subjectId]/page.tsx
src/app/api/inngest/route.ts
inngest/
├── client.ts
└── chapter-uploaded.ts
supabase/migrations/
├── 0006_subjects.sql
├── 0007_chapters.sql
├── 0008_topics.sql
└── 0009_chunks.sql
tests/
├── parse-chapter.test.ts
└── chunk.test.ts
```

**Structure Decision**: Parsing lives in `src/server/ingest` so it is server-only and testable without a browser. The Inngest function is thin: it loads the chapter, calls the parser and persistence helpers, sets status, and notifies.

## Phase 0: Research and Decisions

1. `unified` + `remark-parse` produces an mdast tree; walk only top-level headings and paragraphs.
2. Treat the first depth-1 heading as the title. If absent, derive the title from the filename without its numeric prefix and extension, and emit a warning.
3. Slugify headings with lowercase, trim, replace non-alphanumerics with hyphens, collapse hyphens, and append `-2`, `-3` for duplicates within a chapter.
4. Split on blank lines first. If a paragraph is still over the target, split on sentence boundaries. Target is about 400 words.
5. Persist chunks with denormalized `topic_id`, `chapter_id`, `subject_id`, and `class_id` to keep retrieval filters cheap.
6. Build `tsv` as `to_tsvector('english', coalesce(heading_path, '') || ' ' || content)` and add a GIN index.
7. Use an upsert by `(chapter_id, slug)` for topics, then delete and rebuild chunks for the chapter.

## Phase 1: Design

### Data model

- `subjects`: `id`, `class_id`, `name`, `description`, `created_at`.
- `chapters`: `id`, `subject_id`, `position`, `title`, `raw_md`, `version`, `status`, `updated_at`, `created_at`.
- `topics`: `id`, `chapter_id`, `subject_id`, `slug`, `title`, `position`, `created_at`; unique `(chapter_id, slug)`.
- `chunks`: `id`, `topic_id`, `chapter_id`, `subject_id`, `class_id`, `heading_path`, `content`, `tsv`, `created_at`.

### Ingestion flow

1. Teacher submits file or paste with a filename.
2. Client calls the preview endpoint or server action; the parser returns a preview object without writing.
3. On confirm, the chapter row is created or updated with status `processing`, raw markdown, and the next version.
4. The route emits `chapter.uploaded` to Inngest.
5. The Inngest function parses again server-side, upserts topics by slug, deletes existing chunks, inserts new chunks, sets status `ready`, and calls `notify()` for every enrolled student.
6. On error, status becomes `failed` and the previous ready content remains readable.

### UI

- Subject list on the class page.
- Subject page with chapter upload (file or paste), preview panel, topic tree, chunk counts, and warnings.
- Student subject page with ordered chapters and topics; processing and empty states.

### Validation

Zod schemas for subject creation, chapter upload metadata, preview output, and topic shapes.

## Complexity Tracking

No violations. A separate chunker module is justified because parser tests and retrieval tuning need it independently.

## Risks and Mitigations

- **Malformed markdown**: parser returns structured warnings rather than throwing on recoverable input.
- **Partial ingestion**: status remains `processing` until the transaction finishes; failures set `failed`.
- **Slug drift**: slug rules are frozen by tests so mastery survives future edits.
- **Large chapters**: chunking keeps each chunk near the retrieval budget and never sends a whole chapter to an LLM.
