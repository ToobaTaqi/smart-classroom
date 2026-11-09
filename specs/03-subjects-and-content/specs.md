# Feature Specification: Subjects and Content Ingestion

**Feature Branch**: `03-subjects-and-content`
**Created**: 2026-11-09
**Status**: Draft
**Input**: Constitution section 12, phase 2. Teachers organize content into subjects, upload markdown chapters, preview the parse, and students receive notifications when content changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher creates subjects in a class (Priority: P1)

A teacher opens a class and creates subjects such as "Computer". Each subject belongs to the class and appears in the class's subject list.

**Why this priority**: Subjects are the container for chapters, questions, tests, assignments, and assistant retrieval.

**Independent Test**: Create a subject under a class and confirm it appears for the owning teacher and enrolled students.

**Acceptance Scenarios**:

1. **Given** an owned class, **When** the teacher creates a subject with a name and description, **Then** the subject is saved under that class.
2. **Given** a subject in another teacher's class, **When** a teacher requests it, **Then** zero rows are returned.
3. **Given** an enrolled student, **When** they open the class, **Then** they see the subject but no edit controls.

---

### User Story 2 - Chapter upload with parse preview (Priority: P1)

A teacher uploads a markdown file or pastes markdown into a chapter form. Before saving, the teacher sees a preview: chapter title, topic list, chunk counts, heading paths, and any warnings such as missing `##` headings.

**Why this priority**: Content must be correct before it becomes the source for questions and the tutor. A bad parse pollutes every later feature.

**Independent Test**: Upload a valid two-topic chapter and a chapter without `##` headings, and confirm the preview shows the correct structure and warning.

**Acceptance Scenarios**:

1. **Given** a markdown file named `01-introduction.md` with `#` and two `##` headings, **When** the teacher previews it, **Then** the preview shows the chapter title and two topics with positions.
2. **Given** markdown with no `##` heading, **When** the teacher previews it, **Then** a warning is shown and saving is blocked or explicitly acknowledged.
3. **Given** invalid input, **When** the preview runs, **Then** a clear per-file error is shown and nothing is saved.
4. **Given** a valid preview, **When** the teacher confirms, **Then** the chapter, topics, and chunks are saved.

---

### User Story 3 - Topics and chunks become the content index (Priority: P1)

After a chapter is saved, each `##` heading becomes a topic with a slug, title, and position. Body text becomes chunks split on paragraph boundaries when long, each keeping its heading path.

**Why this priority**: Topics drive mastery, question generation, practice, and analytics. Chunks drive retrieval.

**Independent Test**: Upload a long section and confirm multiple chunks are created, each with the correct heading path and a searchable text vector.

**Acceptance Scenarios**:

1. **Given** a `## CPU` section, **When** parsing finishes, **Then** a topic with slug `cpu` and title `CPU` exists with the correct position.
2. **Given** a section longer than about 400 words, **When** chunking finishes, **Then** it is split on paragraph boundaries and each chunk keeps `Hardware basics > CPU` as its heading path.
3. **Given** multiple chapters, **When** they are listed, **Then** chapter order follows the numeric filename prefix.
4. **Given** a saved chunk, **When** a full-text search runs, **Then** the chunk is returned by its generated text vector.

---

### User Story 4 - Re-upload replaces content without losing mastery (Priority: P2)

A teacher re-uploads a chapter. Its chunks are rebuilt, its version increments, and topics are matched by slug so existing mastery rows continue to point at the same topic.

**Why this priority**: Content improves over time; losing student mastery on every edit would make analytics worthless.

**Independent Test**: Answer a practice question for a topic, re-upload the chapter with edited text, and confirm the mastery row still exists for the same topic.

**Acceptance Scenarios**:

1. **Given** an existing chapter, **When** the teacher re-uploads it, **Then** `version` increments and old chunks are replaced.
2. **Given** a topic slug that exists before and after re-upload, **When** matching completes, **Then** the topic id is preserved.
3. **Given** a removed heading, **When** the re-upload completes, **Then** the removed topic is no longer listed while historical attempts remain intact.
4. **Given** a successful re-upload, **When** the job finishes, **Then** enrolled students receive a `chapter_updated` notification instead of `chapter_added`.

---

### User Story 5 - Students see chapters and topics (Priority: P2)

An enrolled student opens a subject and sees its chapters and topics in order. They cannot see drafts for classes they are not enrolled in.

**Why this priority**: Students need a stable reading structure before practice and the assistant can feel grounded.

**Independent Test**: Enroll a student, upload a chapter, and confirm the chapter and topic tree appear only for enrolled students.

**Acceptance Scenarios**:

1. **Given** an enrolled student, **When** they open the subject, **Then** they see chapters and topics in position order.
2. **Given** a student in another class, **When** they request the subject, **Then** zero rows are returned.
3. **Given** a chapter still processing, **When** the student opens the subject, **Then** a processing state is shown without exposing partial data.

---

### Edge Cases

- Markdown has `##` headings but no `#` title: derive a safe title from the filename and warn.
- Duplicate heading slugs in one chapter: disambiguate deterministically and keep both topics addressable.
- A file has only a title and no body: save the chapter with zero topics and a warning.
- A paragraph exceeds the target chunk size: split on sentence boundaries as a fallback.
- Re-upload changes a heading's capitalization: slugification must keep the topic stable.
- The ingestion job fails midway: the chapter status becomes `failed` and the previous ready version remains readable.
- A student opens a chapter while ingestion is running: status is `processing` and no half-written chunks are served.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A teacher MUST be able to create, list, and view subjects owned by their classes.
- **FR-002**: A subject MUST belong to exactly one class and store a name and description.
- **FR-003**: A teacher MUST be able to upload a chapter as a markdown file or pasted markdown.
- **FR-004**: The system MUST parse chapters without an LLM using a deterministic markdown parser.
- **FR-005**: The parser MUST treat the first `#` heading as the chapter title and each `##` heading as a topic.
- **FR-006**: The parser MUST derive topic slugs from headings and keep them stable across re-uploads.
- **FR-007**: The system MUST show a preview with chapter title, topics, chunk counts, heading paths, and per-file or per-question errors before saving.
- **FR-008**: The system MUST warn when a file has no `##` headings.
- **FR-009**: Body text under a topic MUST become chunks split on paragraph boundaries when longer than about 400 words.
- **FR-010**: Every chunk MUST store `topic_id`, `chapter_id`, `subject_id`, `class_id`, `heading_path`, and `content`.
- **FR-011**: Every chunk MUST expose a generated `tsvector` over its heading path and content, backed by a GIN index.
- **FR-012**: Chapter order MUST follow the numeric filename prefix when present.
- **FR-013**: Re-uploading a chapter MUST replace its chunks and increment `version`.
- **FR-014**: Re-uploading MUST match topics by slug so mastery rows survive.
- **FR-015**: A chapter MUST have status `processing`, `ready`, or `failed`.
- **FR-016**: The ingestion job MUST notify all enrolled students with `chapter_added` or `chapter_updated`.
- **FR-017**: Students MUST only read subjects, chapters, topics, and chunks for classes they are enrolled in.
- **FR-018**: A file or paste with no valid title MUST be rejected with a clear error.
- **FR-019**: The parser MUST be covered by Vitest tests including the no-`##` warning, slug stability, and long-section splitting.

### Key Entities

- **Subject**: A named area of study inside a class.
- **Chapter**: A markdown document with a title, position, raw markdown, version, and processing status.
- **Topic**: A heading-derived unit inside a chapter with a stable slug and position.
- **Chunk**: A searchable passage tied to a topic, chapter, subject, and class, with a heading path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can upload and preview a two-topic chapter in under one minute.
- **SC-002**: 100% of parsed chapters with valid headings produce one topic per `##` heading.
- **SC-003**: A 400-word section produces more than one chunk and every chunk retains its heading path.
- **SC-004**: Re-uploading a chapter preserves 100% of topics whose slugs are unchanged.
- **SC-005**: Full-text search returns a relevant chunk for a keyword query in under one second for the demo dataset.
- **SC-006**: Enrolled students receive a chapter notification after ingestion; students in other classes receive none.
- **SC-007**: All parser tests pass under Vitest.
