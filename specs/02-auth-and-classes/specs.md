# Feature Specification: Authentication and Classes

**Feature Branch**: `02-auth-and-classes`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 1. Users can create accounts with a role, teachers create classes, students join with a code, and notifications reach the right user in real time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account creation and sign-in with a role (Priority: P1)

A new visitor signs up as either a student or a teacher, signs in, and lands on the dashboard for that role. A signed-out visitor cannot open a dashboard.

**Why this priority**: Every other feature depends on knowing who the user is and which role they hold.

**Independent Test**: Create one student and one teacher account, sign each in, and confirm each lands on the correct dashboard while signed-out access is redirected to login.

**Acceptance Scenarios**:

1. **Given** a new visitor on the signup page, **When** they choose the student role and submit valid details, **Then** an account and student profile are created and they can sign in.
2. **Given** valid credentials, **When** the user signs in, **Then** they are routed to `/student` or `/teacher` according to their stored role.
3. **Given** a signed-out visitor, **When** they request a dashboard route, **Then** they are redirected to `/login`.
4. **Given** invalid credentials, **When** the user submits the form, **Then** a clear, non-revealing error is shown.

---

### User Story 2 - Teacher creates a class and shares a join code (Priority: P1)

A teacher creates a class with a name. The system generates a unique join code. The teacher sees the code and can copy it for students.

**Why this priority**: Classes are the tenancy boundary for all content, tests, and analytics.

**Independent Test**: Create a class as a teacher and confirm it appears in the teacher's class list with a unique join code.

**Acceptance Scenarios**:

1. **Given** a signed-in teacher, **When** they create a class with a name, **Then** the class is saved under that teacher with a unique join code.
2. **Given** two classes, **When** their join codes are compared, **Then** the codes differ.
3. **Given** a teacher's class page, **When** it loads, **Then** the join code is visible and copyable.

---

### User Story 3 - Student joins a class and gets a roll number (Priority: P1)

A student enters a join code. The system enrolls them in the matching class and assigns the next sequential roll number. The teacher can later edit that roll number.

**Why this priority**: Enrollment controls every read and write the student can perform.

**Independent Test**: Join a class with a valid code as a student, confirm the enrollment and roll number, then have the teacher change the roll number.

**Acceptance Scenarios**:

1. **Given** a student and a valid join code, **When** they submit the code, **Then** they are enrolled with the next sequential roll number.
2. **Given** an invalid or unknown join code, **When** the student submits it, **Then** a clear error is shown and no enrollment is created.
3. **Given** a student already enrolled in a class, **When** they submit the same code again, **Then** no duplicate enrollment is created.
4. **Given** an enrolled student, **When** the teacher edits the roll number, **Then** the new number is saved and must remain unique within the class.

---

### User Story 4 - In-app notification bell with real time updates (Priority: P2)

A signed-in user sees a bell icon with an unread count. New notifications appear without a page refresh. The user can mark notifications as read.

**Why this priority**: Notifications are the delivery channel for chapter, test, assignment, exam, and reminder events in later phases.

**Independent Test**: Insert a notification for a signed-in user, confirm the bell count updates live, then mark it as read and confirm the count decreases.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** a notification row is inserted for that user, **Then** the bell count updates without a refresh.
2. **Given** unread notifications, **When** the user opens the list and marks one read, **Then** the unread count decreases and the row is marked read.
3. **Given** another user's notification, **When** the first user's client is open, **Then** they never receive or see that row.

---

### Edge Cases

- Signup succeeds but profile creation fails: the account must not be left in a half-created state visible to the user; the failure is logged and a retry path exists.
- Two students submit the same join code at the same moment: both get distinct roll numbers or one gets a clear retry message.
- A student attempts to join a class while already enrolled: no duplicate row and no error that leaks other data.
- A teacher attempts to read a class they do not own: zero rows, not an authorization error that reveals existence.
- Join codes must not be guessable enough to enumerate classes trivially.
- Notifications arrive while the tab is backgrounded: the count is correct when the tab regains focus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support two roles, `student` and `teacher`, chosen at signup and stored on the user's profile.
- **FR-002**: The system MUST create a profile row for every authenticated user with `full_name` and `role`.
- **FR-003**: The system MUST protect every teacher and student route so only authenticated users with the matching role can open it.
- **FR-004**: A teacher MUST be able to create a class with a name; the class MUST be owned by that teacher.
- **FR-005**: Every class MUST have a unique join code generated by the system.
- **FR-006**: A student MUST be able to join a class by entering its join code.
- **FR-007**: Each enrollment MUST store `class_id`, `student_id`, and an integer `roll_number` that is unique within the class.
- **FR-008**: The roll number MUST default to the next sequential number for the class, and the owning teacher MUST be able to edit it.
- **FR-009**: The system MUST prevent duplicate enrollments for the same student and class.
- **FR-010**: The system MUST provide a `notifications` table with `user_id`, `type`, `title`, `body`, `link`, and `read_at`.
- **FR-011**: The system MUST provide a server-side notification helper that inserts notification rows on behalf of the application.
- **FR-012**: The notification bell MUST show the unread count and support mark-as-read.
- **FR-013**: The notification bell MUST subscribe to changes filtered to the signed-in user's `user_id`.
- **FR-014**: Row-level security MUST be enabled on `profiles`, `classes`, `enrollments`, and `notifications`.
- **FR-015**: A student MUST only read their own notifications and enrollments; a teacher MUST only read notifications and enrollments for classes they own.
- **FR-016**: A student MUST NOT be able to read other students' profiles beyond what the leaderboard later exposes.
- **FR-017**: The system MUST NOT expose the service-role key to client code.
- **FR-018**: The teacher class page MUST list enrolled students with their roll numbers and provide an editable roll-number control.

### Key Entities

- **Profile**: The signed-in user's identity, display name, and role.
- **Class**: A teacher-owned group identified by name and a unique join code.
- **Enrollment**: The link between a student and a class, including the roll number.
- **Notification**: A user-targeted message with a type, title, body, optional link, and read state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can sign up, sign in, and reach the correct dashboard in under two minutes.
- **SC-002**: A student can join a class with a valid code in under one minute and receives a unique roll number.
- **SC-003**: A notification inserted for a signed-in user appears in the bell within five seconds without a page refresh.
- **SC-004**: 100% of unauthorized route requests are redirected or rejected; no protected page renders for a signed-out user.
- **SC-005**: A student in another class sees zero rows from a class they are not enrolled in.
- **SC-006**: Roll numbers remain unique within a class after concurrent joins and teacher edits.
