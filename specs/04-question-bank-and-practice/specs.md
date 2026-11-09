# Feature Specification: Question Bank and Practice

**Feature Branch**: `04-question-bank-and-practice`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 3. AI drafts questions from approved chapter topics, teachers review and approve them, and students practice with instant MCQ feedback and mastery updates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI drafts a question bank per topic (Priority: P1)

When a chapter is ingested, the system generates six multiple-choice and three short-answer questions for each topic, with mixed difficulty. Every generated question is saved as a draft with its answer key stored separately.

**Why this priority**: A reviewed bank is the source for practice and tests; without it the teacher has no content to approve.

**Independent Test**: Upload a chapter, wait for generation, and confirm each topic has 6 MCQ and 3 short draft questions with keys and no approved status yet.

**Acceptance Scenarios**:

1. **Given** a ready chapter with two topics, **When** generation runs, **Then** each topic has exactly 6 MCQ and 3 short draft questions.
2. **Given** a generated MCQ, **When** its options and correct option are inspected, **Then** the correct option is stored in the separate key record, not in the student-readable question row.
3. **Given** generation output that fails schema validation, **When** the response is parsed, **Then** one retry is attempted and a second failure records an error without saving malformed questions.
4. **Given** multiple topics queued, **When** generation runs, **Then** only one LLM job runs at a time.

---

### User Story 2 - Teacher reviews, edits, and bulk-approves questions (Priority: P1)

A teacher sees generated and manual questions grouped by topic, can edit prompt, options, marks, difficulty, and key, and can approve questions individually or in bulk.

**Why this priority**: The teacher must stay in control; AI output is a draft until approved.

**Independent Test**: Edit one draft question, bulk-approve several others, and confirm only approved questions become visible to students.

**Acceptance Scenarios**:

1. **Given** a draft question, **When** the teacher approves it, **Then** its status becomes `approved`.
2. **Given** selected approved-eligible drafts, **When** the teacher bulk-approves, **Then** all selected rows become `approved` and saving is atomic.
3. **Given** an approved question, **When** the teacher edits it, **Then** the edit is saved and students see the updated prompt on the next practice session.
4. **Given** a student, **When** they query the bank, **Then** only `approved` questions are returned and no key data is present.
5. **Given** a manually authored question, **When** it is saved, **Then** its source is `manual` and it follows the same review and approval path.

---

### User Story 3 - Student practices a topic (Priority: P1)

A student chooses a subject, topic, difficulty, and count. The system draws approved questions, preferring ones the student has not answered. MCQ answers get instant server-side feedback; short answers get AI grading with a practice flag.

**Why this priority**: Practice is the main learning loop and the first producer of mastery data.

**Independent Test**: Answer an MCQ correctly and incorrectly, then answer a short question, and confirm feedback and mastery changes.

**Acceptance Scenarios**:

1. **Given** enough approved questions, **When** the student starts practice, **Then** the requested count is returned with unseen questions preferred.
2. **Given** an MCQ answer, **When** the student submits it, **Then** the server returns correct or incorrect without exposing the key in the client payload before submission.
3. **Given** a short answer, **When** it is submitted, **Then** it is graded by the LLM grader and stored with a practice flag.
4. **Given** any practice answer, **When** it is recorded, **Then** mastery updates with weight 0.1 and the leaderboard does not change.
5. **Given** a topic with fewer approved questions than requested, **When** practice starts, **Then** the available questions are returned with a clear message.

---

### User Story 4 - Request fresh questions when a topic runs dry (Priority: P2)

If a topic has fewer than five unseen approved questions for the student, the student can request fresh questions. This queues additional draft questions for teacher review; it never bypasses approval.

**Why this priority**: It keeps practice useful without letting unreviewed content reach students.

**Independent Test**: Exhaust a topic, press "fresh questions", and confirm new drafts appear in the teacher review queue while nothing unapproved appears in practice.

**Acceptance Scenarios**:

1. **Given** fewer than five unseen approved questions, **When** the student requests fresh questions, **Then** a generation request is queued.
2. **Given** five or more unseen approved questions, **When** the student presses the button, **Then** no LLM call is made.
3. **Given** newly generated drafts, **When** the student reloads practice, **Then** the drafts are not served until approved.

---

### Edge Cases

- A topic has no chunks: generation is skipped with a recorded reason.
- The LLM returns the wrong count or an invalid difficulty: the response is rejected and retried once.
- Duplicate questions are generated: the teacher can see and delete them; practice selection does not double-count the same question in one session.
- The provider rate-limits the request: exponential backoff retries, then the job fails visibly without corrupting the bank.
- A student submits an answer twice in one session: the second submission is rejected or treated as idempotent.
- A short-answer grader fails after retries: the practice answer is recorded with no score and flagged for review rather than silently marked wrong.
- Mastery has no prior row: the first percentage becomes the starting value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST run question-bank generation as an Inngest function named `bank.generate`, one call per topic.
- **FR-002**: Generation MUST produce exactly 6 MCQ and 3 short questions per topic with mixed difficulty.
- **FR-003**: Generation MUST use structured output validated by Zod before saving.
- **FR-004**: Generated questions MUST be saved with status `draft` and source `ai`.
- **FR-005**: Correct options, answer keys, and rubrics MUST live in `question_keys`, readable only by teachers.
- **FR-006**: All LLM jobs MUST run with concurrency 1.
- **FR-007**: A teacher MUST be able to edit drafts and approve them individually or in bulk.
- **FR-008**: Only `approved` questions MUST ever be served to students.
- **FR-009**: A teacher MUST be able to author manual questions that follow the same approval path.
- **FR-010**: A student MUST be able to start practice by subject, topic, difficulty, and count.
- **FR-011**: Practice selection MUST prefer questions the student has not answered.
- **FR-012**: MCQ answers MUST be graded server-side with instant feedback.
- **FR-013**: Short answers MUST be graded by the LLM grader and flagged as practice.
- **FR-014**: Every practice answer MUST update `topic_mastery` with `a = 0.1` and `pct` of 100 or 0.
- **FR-015**: Practice MUST NOT change leaderboard points.
- **FR-016**: The "fresh questions" action MUST only run when the topic has fewer than 5 unseen approved questions for that student.
- **FR-017**: Fresh generation MUST create drafts only, never approved questions.
- **FR-018**: The bank and practice data MUST be protected by RLS; a student can read only approved questions for enrolled classes.
- **FR-019**: The system MUST record LLM token usage for every generation and grading call.
- **FR-020**: The teacher question-bank view MUST show per-topic counts and validation problems.

### Key Entities

- **Question**: A prompt, type, options, marks, difficulty, status, and source.
- **Question key**: The protected correct option, answer key, and rubric.
- **Practice attempt**: One student response to one question in practice mode.
- **Topic mastery**: The rolling score and data-point count per student and topic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After ingestion, 100% of ready topics have 6 MCQ and 3 short drafts unless generation records an explicit failure.
- **SC-002**: A teacher can review and bulk-approve a topic's bank in under three minutes.
- **SC-003**: 0 approved questions reach a student before teacher approval; 0 key rows are readable by students.
- **SC-004**: A student receives MCQ feedback within one second of submission.
- **SC-005**: Mastery changes after every practice answer and never changes leaderboard points.
- **SC-006**: The "fresh questions" guard prevents an LLM call when five or more unseen approved questions exist.
- **SC-007**: Generation runs one topic at a time with no overlapping LLM jobs.
