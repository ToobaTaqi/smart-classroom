# Implementation Plan: Assignments, Schedule, and Assistant

**Branch**: `07-assignments-schedule-assistant` | **Date**: 2026-11-09 | **Spec**: [specs.md](./specs.md)
**Input**: Feature specification from `/specs/07-assignments-schedule-assistant/specs.md`

## Summary

Add assignments and completion tracking, exam schedule management, a complete student dashboard, and the grounded assistant: full-text retrieval over chunks, a strict system prompt, four allow-listed tools with confirmation for writes, full auditing, a daily chat limit, and a reminder cron.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: Next.js App Router, Supabase, Inngest, Groq through `chatWithTools`, Zod, unified/remark-parse for assignment rendering, shadcn/ui
**Storage**: Supabase Postgres; `assignments`, `assignment_completions`, `exam_schedule`, `chat_messages`, `pending_actions`, `reminders`, `assistant_audit_log`
**Testing**: Vitest for retrieval shaping, tool schemas, daily-limit logic, and citation formatting
**Target Platform**: Vercel + Supabase
**Project Type**: Single web application
**Performance Goals**: Dashboard and assistant responses feel immediate for the demo dataset; retrieval under one second
**Constraints**: Context about 1,500 tokens; answers about 500 tokens; last 6 messages; no embeddings; no restricted tools
**Scale/Scope**: One subject per conversation; tens of chunks; 30 user messages per student per day

## Constitution Check

| Gate | Status | Evidence |
|------|--------|----------|
| Retrieval method | PASS | `websearch_to_tsquery` over `chunks`, class and subject filters, top 4 |
| Prompt budget | PASS | 1,500-token context cap and 500-token answer cap |
| Grounding | PASS | System prompt requires citations and a not-covered response |
| Tool safety | PASS | Allow-list only; writes require confirmation; full audit |
| No grade tools | PASS | Tool set excludes grades, attempts, and leaderboard |
| Daily limit | PASS | `CHAT_DAILY_LIMIT_PER_STUDENT = 30` enforced server-side |
| RLS | PASS | Own chat, pending actions, reminders, notifications, and audit |

## Project Structure

### Documentation (this feature)

```text
specs/07-assignments-schedule-assistant/
├── specs.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
src/server/
├── assistant/
│   ├── retrieval.ts        # FTS query, filters, top-k, context assembly
│   ├── prompts.ts          # system prompt rules and citation format
│   ├── tools.ts            # allow-list, Zod args, executors
│   ├── pending.ts          # create, confirm, reject pending actions
│   └── audit.ts            # assistant_audit_log writer
├── notifications/notify.ts
└── assignments/
    └── complete.ts
src/app/teacher/
├── assignments/page.tsx
└── schedule/page.tsx
src/app/student/
├── page.tsx                # full dashboard
└── assistant/page.tsx
src/app/api/assistant/
├── route.ts                # chat turn
└── pending/[id]/route.ts   # confirm or reject
inngest/
├── reminder-cron.ts
└── noop.ts
supabase/migrations/
├── 0020_assignments.sql
├── 0021_assignment_completions.sql
├── 0022_exam_schedule.sql
├── 0023_chat_messages.sql
├── 0024_pending_actions.sql
├── 0025_reminders.sql
└── 0026_assistant_audit_log.sql
tests/
├── retrieval.test.ts
├── assistant-tools.test.ts
└── daily-limit.test.ts
```

**Structure Decision**: The assistant is split into retrieval, prompt, tools, pending actions, and audit modules so each can be tested in isolation and so no route handler can bypass confirmation or auditing.

## Phase 0: Research and Decisions

1. Retrieval query: `websearch_to_tsquery('english', <question>)` against `chunks.tsv`, filtered by `class_id` and `subject_id`, ordered by `ts_rank`, limited to `RETRIEVAL_TOP_K = 4`.
2. Token budgeting: approximate 4 characters per token. Trim chunks from the lowest rank until the context is under about 1,500 tokens. Never send whole chapters.
3. History: last 6 messages for the student and subject, oldest first.
4. Tools use plain tool calling only; structured outputs are not combined with tool calling.
5. Tool arguments are validated with Zod before execution. Unknown tool names are rejected and audited.
6. Write tools insert a `pending_actions` row with status `pending` and return a confirmation card identifier. No side effect occurs until confirmation.
7. Confirmation re-validates ownership, status, and arguments, executes the tool, stores the result, sets status `confirmed` or `rejected`, and appends to `assistant_audit_log`.
8. Daily limit counts `chat_messages` where `role = 'user'` and `created_at` is today in the student's timezone; the constitution does not specify a timezone, so use UTC and log the decision.
9. Reminder cron runs every 5 minutes, selects `remind_at <= now()` and `done = false`, inserts one `reminder` notification per reminder, and sets `done = true` in the same transaction.

## Phase 1: Design

### Data model

- `assignments`: `id`, `subject_id`, `title`, `description_md`, `due_at`, `created_by`, `created_at`.
- `assignment_completions`: `id`, `assignment_id`, `student_id`, `done_at`, `created_at`; unique `(assignment_id, student_id)`.
- `exam_schedule`: `id`, `class_id`, `subject_id`, `exam_date`, `start_time`, `duration_minutes`, `notes`, `created_at`.
- `chat_messages`: `id`, `student_id`, `subject_id`, `role` (`user|assistant`), `content`, `citations` jsonb, `created_at`.
- `pending_actions`: `id`, `student_id`, `tool`, `args` jsonb, `status` (`pending|confirmed|rejected`), `created_at`.
- `reminders`: `id`, `student_id`, `title`, `remind_at`, `done` bool, `created_at`.
- `assistant_audit_log`: `id`, `student_id`, `tool`, `args` jsonb, `result` jsonb, `confirmed` bool, `created_at`.

### Assistant turn

1. Enforce the daily limit.
2. Load last 6 messages.
3. Retrieve top 4 chunks for class + subject.
4. Assemble a context block with heading paths and content.
5. Call `chatWithTools` with the system prompt and allow-listed tool schemas.
6. For `list_upcoming`, execute immediately and audit.
7. For a write tool, create a pending action, audit the proposal, and return a confirmation card.
8. Save the assistant message with citations.
9. Never expose `question_keys`, grades, attempts, or leaderboard data to the model or tools.

### Tools

- `list_upcoming()`: read-only; tests, assignments, and exams for the student's classes, ordered by date.
- `create_practice_set({ topic, difficulty, count })`: write; draws approved bank questions and returns a practice link after confirmation.
- `set_reminder({ title, remind_at })`: write; creates a reminder after confirmation.
- `mark_notifications_read()`: write; marks all of the student's notifications read after confirmation.

### Dashboard

One server-rendered page that queries tests, assignments, exams, notifications, subjects, leaderboard rank, and weak topics in a small number of batch queries. Weak topics link to practice pre-filled with the topic.

## Complexity Tracking

No violations. Pending actions are required by the constitution, and the split between proposal and execution is the simplest way to make writes safe.

## Risks and Mitigations

- **Prompt injection**: the system prompt treats all retrieved and user text as data; no tool can change grades.
- **Token overrun**: character-based budget with lowest-rank trimming.
- **Duplicate confirmation**: confirmation is idempotent on pending status.
- **Audit gaps**: audit writes happen in the same service as tool execution and proposal.
- **Reminder double-send**: transactional select-and-update or a unique notification reference per reminder.
