import { parseChapterMarkdown } from "@/server/ingest/parser";

import { inngest } from "../client";
import { chapterUploaded } from "../events";

/**
 * Preview a chapter upload without touching the database.
 *
 * This is the first durable stage of the real ingestion job: parse the
 * markdown, report the topics and chunks that would be written, and surface
 * warnings. Later steps can upsert topics, rebuild chunks, mark the chapter
 * ready, notify students, and enqueue question generation.
 */
export const chapterIngestPreview = inngest.createFunction(
  {
    id: "chapter-ingest-preview",
    name: "Chapter ingest preview",
    triggers: [{ event: chapterUploaded }],
  },
  async ({ event, step }) => {
    const parsed = await step.run("preview-chapter", async () => {
      return parseChapterMarkdown(event.data.rawMd, {
        fileName: event.data.fileName,
      });
    });

    return {
      fileName: event.data.fileName,
      title: parsed.title,
      topicCount: parsed.topics.length,
      chunkCount: parsed.chunkCount,
      wordCount: parsed.wordCount,
      topics: parsed.topics.map((topic) => ({
        title: topic.title,
        slug: topic.slug,
        chunks: topic.chunks.length,
      })),
      warnings: parsed.warnings,
    };
  },
);
