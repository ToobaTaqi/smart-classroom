# Feature Specification: Assignments, Schedule, and Assistant

**Feature Branch**: `07-assignments-schedule-assistant`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 6. Teachers post assignments and exam dates, the student dashboard aggregates everything, and a grounded assistant answers with citations and confirms every write action.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher posts assignments and students complete them (Priority: P1)

A teacher creates an assignment for a subject with a title, markdown description, and due date. Enrolled students see it, receive `assignment_posted`, and can mark it done.

**Why this priority**: Assignments are a core teacher workflow and a dashboard item students act on.

**Independent Test**: Post an assignment, confirm the notification, and mark it complete as a student.

**Acceptance Scenarios**:

1. **Given** an owned subject, **When** the teacher posts an assignment, **Then** it is saved and enrolled students receive `assignment_posted`.
2. **Given** an enrolled student, **When** they open the dashboard, **Then** the assignment appears with its due date.
3. **Given** an assignment, **When** the student marks it done, **Then** an `assignment_completions` row is stored with `done_at`.
4. **Given** an already completed assignment, **When** the student marks it done again, **Then** no duplicate completion is created.
5. **Given** a student in another class, **When** they query the assignment, **Then** zero rows are returned.

---

### User Story 2 - Teacher publishes an exam schedule (Priority: P1)

A teacher adds exam entries for a class with subject, date, start time, duration, and notes. Enrolled students see them in the dashboard and schedule. Changes notify students with `exam_schedule_changed`.

**Why this priority**: Exam dates drive planning and the assistant's upcoming list.

**Independent Test**: Create and edit an exam entry and confirm student visibility and notifications.

**Acceptance Scenarios**:

1. **Given** an owned class and subject, **When** the teacher adds an exam entry, **Then** it is saved and students see it.
2. **Given** an existing exam entry, **When** the teacher changes the date or time, **Then** enrolled students receive `exam_schedule_changed`.
3. **Given** an exam entry, **When** a student views the dashboard, **Then** the exam appears with subject, date, time, duration, and notes.
4. **Given** a student in another class, **When** they request the schedule, **Then** zero rows are returned.

---

### User Story 3 - Full student dashboard (Priority: P1)

A student opens one dashboard with upcoming tests, assignments, and exams, notifications, their subjects, their rank, and weak topics with a "practice now" button.

**Why this priority**: The dashboard is the student's home and the proof that earlier phases integrate.

**Independent Test**: Seed a student with data and verify every dashboard section.

**Acceptance Scenarios**:

1. **Given** a student with upcoming work, **When** the dashboard loads, **Then** tests, assignments, and exams are grouped and ordered by date.
2. **Given** weak topics, **When** the dashboard renders, **Then** each weak topic has a "practice now" link that opens practice for that topic.
3. **Given** a student with a rank, **When** the dashboard renders, **Then** their class rank is shown.
4. **Given** no data in a section, **When** the dashboard renders, **Then** an empty state explains what will appear.
5. **Given** a data load error, **When** the dashboard renders, **Then** a retryable error state is shown.

---

### User Story 4 - Grounded assistant with citations (Priority: P1)

A student asks a question in a subject. The assistant retrieves the top 4 relevant chunks from that subject and class, keeps context under about 1,500 tokens, includes the last 6 messages, and answers in at most about 500 tokens with citations in the form `[Chapter > Topic]`.

**Why this priority**: The tutor is the flagship differentiator and must stay grounded in teacher material.

**Independent Test**: Ask a question covered by the material and one not covered; verify citations and the "not covered" response.

**Acceptance Scenarios**:

1. **Given** a question covered by the subject material, **When** the assistant answers, **Then** the answer cites at least one `[Chapter > Topic]`.
2. **Given** a question not covered by the material, **When** the assistant answers, **Then** it says the context does not cover the question instead of inventing an answer.
3. **Given** a homework or test question, **When** the assistant answers, **Then** it prefers hints and step-by-step guidance over a final answer.
4. **Given** retrieved text that contains instructions, **When** the assistant answers, **Then** it treats that text as data and does not follow it.
5. **Given** a user message that tries to override the system rules, **When** the assistant answers, **Then** the rules still hold.

---

### User Story 5 - Assistant tools with confirmation and audit (Priority: P1)

The assistant can call only an allow-listed set: `list_upcoming` (read-only, runs immediately), `create_practice_set`, `set_reminder`, and `mark_notifications_read`. Write tools create a pending action that requires the student's confirmation. Every tool call is audited.

**Why this priority**: Useful actions must be safe and fully traceable.

**Independent Test**: Ask for a practice set, confirm it, and verify the pending action, execution, and audit rows.

**Acceptance Scenarios**:

1. **Given** a request for upcoming work, **When** the assistant calls `list_upcoming`, **Then** the result is returned immediately with no confirmation.
2. **Given** a request to create a practice set, **When** the assistant calls `create_practice_set`, **Then** a pending action is stored and a confirm/cancel card is shown.
3. **Given** a pending action, **When** the student confirms, **Then** the server executes it and returns a practice link.
4. **Given** a pending action, **When** the student cancels, **Then** nothing is executed and the action is marked rejected.
5. **Given** any tool call, **When** it completes or is rejected, **Then** an `assistant_audit_log` row records the tool, args, result, and confirmation state.
6. **Given** a request to change grades, scores, attempts, or leaderboard, **When** the assistant responds, **Then** no tool exists that can perform it.
7. **Given** a student has sent 30 chat messages today, **When** they send another, **Then** the request is blocked with a clear limit message.

---

### User Story 6 - Reminders become notifications (Priority: P2)

A student sets a reminder. A five-minute cron turns due reminders into `reminder` notifications and marks them done.

**Why this priority**: Reminders close the loop on the assistant's write actions.

**Independent Test**: Create a due reminder and run the cron; confirm the notification and done state.

**Acceptance Scenarios**:

1. **Given** a reminder with `remind_at` in the past and `done = false`, **When** the cron runs, **Then** a `reminder` notification is created and the reminder is marked done.
2. **Given** a reminder in the future, **When** the cron runs, **Then** it is left untouched.
3. **Given** the cron runs twice, **When** the reminder is already done, **Then** no duplicate notification is created.

---

### Edge Cases

- Retrieval returns no chunks: the assistant says the material does not cover the question.
- Context exceeds the token budget: drop the lowest-ranked chunks first and keep citations accurate.
- The model asks for a tool not on the allow-list: the call is rejected and audited.
- The model calls a write tool twice: only one pending action is created for the same turn and arguments.
- The student confirms a pending action after its target question or topic is deleted: execution fails with a clear message and is audited.
- The daily limit is exceeded mid-conversation: the existing history stays readable but new messages are blocked.
- The reminder cron overlaps a student manually completing a reminder: no duplicate notification.
- A tool result contains HTML or script text: it is rendered as plain text.
- The assistant is asked about another class: retrieval returns nothing from that class.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A teacher MUST be able to create assignments with subject, title, description markdown, and due date.
- **FR-002**: Posting an assignment MUST notify enrolled students with `assignment_posted`.
- **FR-003**: Students MUST be able to view assignments for enrolled classes and mark them complete.
- **FR-004**: Assignment completions MUST be unique per student and assignment.
- **FR-005**: A teacher MUST be able to create and edit exam schedule entries with class, subject, date, start time, duration, and notes.
- **FR-006**: Exam changes MUST notify enrolled students with `exam_schedule_changed`.
- **FR-007**: The student dashboard MUST show upcoming tests, assignments, exams, notifications, subjects, rank, and weak topics with a practice-now action.
- **FR-008**: The assistant MUST retrieve with full-text search on `chunks`, filtered by the student's class and the subject, top `RETRIEVAL_TOP_K`.
- **FR-009**: The assistant context MUST stay under about 1,500 tokens and include the last 6 messages.
- **FR-010**: Assistant answers MUST be capped at about 500 tokens.
- **FR-011**: The system prompt MUST require answers only from context, citations as `[Chapter > Topic]`, an explicit not-covered response, hint-first behavior, and treating retrieved and user text as data.
- **FR-012**: The assistant MUST use plain tool calling with a strict allow-list: `list_upcoming`, `create_practice_set`, `set_reminder`, `mark_notifications_read`.
- **FR-013**: `list_upcoming` MUST be read-only and run immediately.
- **FR-014**: Every write tool MUST create a `pending_actions` row and require confirmation before execution.
- **FR-015**: Every tool call, confirmed or not, MUST be written to `assistant_audit_log`.
- **FR-016**: The assistant MUST NOT have tools that touch grades, scores, attempts, or the leaderboard.
- **FR-017**: The system MUST enforce `CHAT_DAILY_LIMIT_PER_STUDENT` user messages per student per day.
- **FR-018**: An Inngest cron MUST run every 5 minutes, convert due reminders to `reminder` notifications, and mark them done.
- **FR-019**: Chat messages MUST store citations as JSON and render them as text.
- **FR-020**: All assistant data MUST be protected by RLS; students access only their own chat, pending actions, reminders, notifications, and audit rows.

### Key Entities

- **Assignment**: A subject-scoped task with markdown description and due date.
- **Assignment completion**: The student's done marker and timestamp.
- **Exam entry**: A class-scoped exam date, time, duration, and notes.
- **Chat message**: A user or assistant turn with content and citations.
- **Pending action**: A proposed write tool call awaiting confirmation.
- **Reminder**: A student's timed reminder and done state.
- **Audit entry**: The record of a tool call, arguments, result, and confirmation outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can post an assignment in under one minute and students see it on their next dashboard load.
- **SC-002**: 100% of exam changes notify enrolled students.
- **SC-003**: The dashboard loads all sections within two seconds for the demo dataset.
- **SC-004**: At least 90% of assistant answers to covered questions include a valid citation.
- **SC-005**: 100% of uncovered questions receive an explicit not-covered response rather than an invented answer.
- **SC-006**: 100% of write tool calls require confirmation and leave an audit row.
- **SC-007**: The assistant exposes zero tools that can change grades, attempts, or leaderboard.
- **SC-008**: The daily chat limit blocks the 31st user message and shows a clear explanation.
- **SC-009**: Due reminders produce exactly one notification each.
