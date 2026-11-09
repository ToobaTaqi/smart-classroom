# Feature Specification: Tests and MCQ Grading

**Feature Branch**: `05-tests-and-mcq-grading`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 4. Teachers build and publish tests in four ways; students take a timed test once, answers save as they go, expired attempts auto-submit, and MCQ answers grade instantly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher builds a test (Priority: P1)

A teacher creates a test by picking approved bank questions, auto-picking N questions by topic and difficulty, entering questions manually, or importing markdown. Every test starts as a draft.

**Why this priority**: Tests are the graded assessment loop and feed mastery, leaderboard, and analytics.

**Independent Test**: Build one test with each of the four methods and confirm each saves as a draft with the expected questions and marks.

**Acceptance Scenarios**:

1. **Given** approved bank questions, **When** the teacher picks them, **Then** they are added to the test with their marks.
2. **Given** a topic, difficulty, and count N, **When** the teacher auto-picks, **Then** exactly N available questions are selected or a clear shortfall message is shown.
3. **Given** a manual question form, **When** the teacher saves a valid question, **Then** it is attached to the test.
4. **Given** valid test markdown, **When** the teacher previews the import, **Then** each question is shown with marks, topic, difficulty, type, and any per-question error before saving.
5. **Given** invalid test markdown, **When** the teacher previews it, **Then** nothing is saved and the broken question is identified.
6. **Given** a saved test, **When** the teacher opens it, **Then** its status is `draft`.

---

### User Story 2 - Teacher publishes a test (Priority: P1)

A teacher publishes a draft test with a duration, opening time, and closing time. Publishing notifies all enrolled students.

**Why this priority**: Students must be told when an assessment opens.

**Independent Test**: Publish a test and confirm enrolled students receive a `test_published` notification while other classes do not.

**Acceptance Scenarios**:

1. **Given** a draft test with valid duration and dates, **When** the teacher publishes it, **Then** status becomes `published`.
2. **Given** a published test, **When** the publish action completes, **Then** every enrolled student receives `test_published`.
3. **Given** a test with `closes_at` before `opens_at`, **When** the teacher publishes, **Then** validation blocks it with a clear message.
4. **Given** a published test, **When** a student opens it before `opens_at` or after `closes_at`, **Then** they cannot start an attempt.

---

### User Story 3 - Student takes a timed test (Priority: P1)

A student starts one attempt, answers questions, and the server saves each answer. The deadline is the earlier of start time plus duration and the test closing time. The client auto-submits at expiry and late submissions are rejected.

**Why this priority**: Timed assessment is the core graded experience.

**Independent Test**: Start a test, save answers, wait for expiry, and confirm auto-submission and rejection of a late manual submit.

**Acceptance Scenarios**:

1. **Given** a published test and no prior attempt, **When** the student starts, **Then** one attempt is created with status `in_progress`.
2. **Given** an in-progress attempt, **When** the student answers a question, **Then** the answer is saved server-side immediately.
3. **Given** an in-progress attempt, **When** the deadline passes, **Then** the client auto-submits and the server records the submission time.
4. **Given** an attempt already submitted, **When** the student tries to submit again, **Then** it is rejected.
5. **Given** a student who already has an attempt for the test, **When** they open the test, **Then** they are sent to their existing attempt or result rather than a new one.
6. **Given** the attempt is past the deadline, **When** a submission arrives, **Then** it is rejected as late.

---

### User Story 4 - Expiry cron auto-submits abandoned attempts (Priority: P2)

A recurring job every five minutes submits any in-progress attempt whose deadline has passed, even if the student closed the browser.

**Why this priority**: Abandoned attempts must not stay open forever or block grading.

**Independent Test**: Create an expired in-progress attempt and run the cron; confirm it becomes submitted.

**Acceptance Scenarios**:

1. **Given** an in-progress attempt past its deadline, **When** the cron runs, **Then** the attempt is submitted with the current saved answers.
2. **Given** an in-progress attempt still within its deadline, **When** the cron runs, **Then** it is left untouched.
3. **Given** the cron runs twice, **When** the attempt is already submitted, **Then** no duplicate submission occurs.

---

### User Story 5 - MCQ grading and results (Priority: P1)

On submit, MCQ answers are graded deterministically. The student sees a score and per-question feedback. Correct answers are revealed only after the test closes.

**Why this priority**: Immediate MCQ feedback is the first end-to-end graded outcome.

**Independent Test**: Submit an MCQ test and verify scores, feedback, and the answer-reveal rule.

**Acceptance Scenarios**:

1. **Given** a submitted attempt, **When** MCQ grading runs, **Then** each MCQ score is 0 or its marks and the total is recomputed.
2. **Given** a submitted attempt before `closes_at`, **When** the student views results, **Then** they see their score and feedback but not correct answers.
3. **Given** a test past `closes_at`, **When** the student views results, **Then** correct answers are revealed.
4. **Given** a test with short answers, **When** MCQ grading finishes, **Then** the attempt remains not fully graded until short answers are graded in phase 06.

---

### Edge Cases

- A student starts at the exact moment the test closes: the deadline is now and the attempt is immediately expired.
- The same answer is saved twice: the save is idempotent.
- The browser clock is wrong: the server deadline is authoritative.
- A test has zero questions: publishing is blocked.
- A question is deleted from the bank after being added to a test: the test question keeps a snapshot or the deletion is blocked.
- Markdown import has duplicate question numbers: each duplicate is reported.
- A student loses connectivity: saved answers survive and the client retries the next save.
- The cron overlaps a client auto-submit: only the first submission wins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A teacher MUST be able to create a test with a title, subject, duration, opening time, and closing time.
- **FR-002**: A test MUST be saved as `draft` on creation.
- **FR-003**: A teacher MUST be able to add questions by selecting approved bank questions, auto-picking N by topic and difficulty, entering them manually, or importing markdown.
- **FR-004**: The test import parser MUST validate markdown with Zod and show a preview with per-question errors before saving.
- **FR-005**: Imported questions from test markdown MUST get status `approved` and source `import`.
- **FR-006**: Publishing MUST set status `published` and notify enrolled students with `test_published`.
- **FR-007**: A test MUST have at most one attempt per student, enforced by a unique constraint.
- **FR-008**: The server deadline MUST be `min(started_at + duration_minutes, closes_at)`.
- **FR-009**: Answers MUST save server-side as the student progresses.
- **FR-010**: Late submissions MUST be rejected.
- **FR-011**: The client MUST auto-submit when the deadline is reached.
- **FR-012**: An Inngest cron MUST run every 5 minutes and auto-submit expired in-progress attempts.
- **FR-013**: MCQ answers MUST be graded deterministically on submit.
- **FR-014**: The results page MUST show the score and per-question feedback.
- **FR-015**: Correct answers MUST be revealed only after `closes_at`.
- **FR-016**: Students MUST only read published tests for classes they are enrolled in and only their own attempts and answers.
- **FR-017**: The test-take response MUST NOT include correct answers, keys, or rubrics.
- **FR-018**: The system MUST prevent duplicate submissions from the client and the cron.

### Key Entities

- **Test**: A subject-scoped assessment with duration, opening and closing times, status, and creator.
- **Test question**: The ordered link between a test and a question with marks.
- **Attempt**: One student's run through a test with timing and score.
- **Answer**: One response to one question with score, grader, confidence, feedback, and review flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can build and publish a 10-question MCQ test in under five minutes.
- **SC-002**: 100% of enrolled students receive `test_published` within ten seconds of publishing.
- **SC-003**: A student can complete an MCQ test end to end and see a score.
- **SC-004**: 100% of expiring attempts are submitted by the cron within five minutes of their deadline.
- **SC-005**: Late submissions are rejected 100% of the time.
- **SC-006**: Correct answers are visible to students only after the test closes.
- **SC-007**: No test-take payload contains a correct option, answer key, or rubric.
