import { eventType } from "inngest";
import { z } from "zod";

/**
 * Payload sent when a teacher uploads or replaces a chapter.
 *
 * `chapterId` and `subjectId` are optional while the database layer is still
 * being built. Once chapters exist, the upload action fills them in so the
 * ingestion job can locate the row to update.
 */
export const chapterUploadedDataSchema = z.object({
  chapterId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  fileName: z.string().min(1, "fileName is required"),
  rawMd: z.string().min(1, "rawMd is required"),
});

export type ChapterUploadedData = z.infer<typeof chapterUploadedDataSchema>;

export const chapterUploaded = eventType("chapter.uploaded", {
  schema: chapterUploadedDataSchema,
});
