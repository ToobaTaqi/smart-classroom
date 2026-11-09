import { chapterIngestPreview } from "./functions/chapter-ingest-preview";

/**
 * Every background function that the `/api/inngest` endpoint serves.
 * Add new functions to this array so the Dev Server can discover them.
 */
export const functions = [chapterIngestPreview];
