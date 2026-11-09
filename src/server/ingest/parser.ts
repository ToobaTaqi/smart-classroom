/**
 * Deterministic markdown chapter parser.
 *
 * A chapter is `# Chapter title` followed by one or more `## Topic` sections.
 * Body text under each topic is split into chunks of roughly 400 words on
 * paragraph boundaries, keeping a heading path such as
 * "Hardware basics > CPU".
 *
 * No database or LLM work happens here. The Inngest ingestion job calls this
 * parser first, then persists the result in a later step.
 */

export const MAX_CHUNK_WORDS = 400;

export interface ParsedChunk {
  headingPath: string;
  content: string;
  wordCount: number;
}

export interface ParsedTopic {
  slug: string;
  title: string;
  position: number;
  chunks: ParsedChunk[];
}

export interface ParsedChapter {
  title: string;
  topics: ParsedTopic[];
  wordCount: number;
  chunkCount: number;
  warnings: string[];
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "topic";
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function titleFromFileName(fileName?: string): string {
  if (!fileName) {
    return "Untitled chapter";
  }

  return fileName
    .replace(/\.mdx?$/i, "")
    .replace(/^\d+[-_]?/, "")
    .trim() || "Untitled chapter";
}

function splitLongParagraph(paragraph: string, maxWords: number): string[] {
  const words = paragraph.split(/\s+/);
  if (words.length <= maxWords) {
    return [paragraph];
  }

  const parts: string[] = [];
  for (let index = 0; index < words.length; index += maxWords) {
    parts.push(words.slice(index, index + maxWords).join(" "));
  }

  return parts;
}

function chunkBody(body: string, maxWords = MAX_CHUNK_WORDS): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph, maxWords));

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const flush = () => {
    if (current.length > 0) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentWords = 0;
    }
  };

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);

    if (currentWords + paragraphWords > maxWords) {
      flush();
    }

    current.push(paragraph);
    currentWords += paragraphWords;
  }

  flush();
  return chunks;
}

export function parseChapterMarkdown(
  rawMarkdown: string,
  options: { fileName?: string } = {},
): ParsedChapter {
  const warnings: string[] = [];
  const lines = rawMarkdown.replace(/\r\n?/g, "\n").split("\n");

  let title = "";
  let currentTopic: { title: string; lines: string[] } | null = null;
  const topicBlocks: { title: string; lines: string[] }[] = [];
  let introLines = 0;
  let inFence = false;

  const flushTopic = () => {
    if (currentTopic) {
      topicBlocks.push(currentTopic);
      currentTopic = null;
    }
  };

  for (const line of lines) {
    const fenceMatch = line.trimStart().startsWith("```");
    const headingMatch = !inFence && /^(#{1,2})\s+(.+?)\s*$/.exec(line);

    if (headingMatch) {
      const [, hashes, heading] = headingMatch;

      if (hashes === "#") {
        if (!title) {
          title = heading.trim();
        } else {
          warnings.push(`Extra chapter heading ignored: "${heading.trim()}".`);
        }
        continue;
      }

      flushTopic();
      currentTopic = { title: heading.trim(), lines: [] };
      continue;
    }

    if (fenceMatch) {
      inFence = !inFence;
    }

    if (currentTopic) {
      currentTopic.lines.push(line);
    } else if (line.trim()) {
      introLines += 1;
    }
  }

  if (inFence) {
    warnings.push("A code fence was never closed.");
  }

  flushTopic();

  if (!title) {
    title = titleFromFileName(options.fileName);
    warnings.push("No `#` chapter title found; used the file name instead.");
  }

  if (topicBlocks.length === 0) {
    warnings.push("No `##` topic headings found, so no topics or chunks were created.");
  }

  if (introLines > 0) {
    warnings.push("Text before the first `##` topic heading was ignored.");
  }

  const usedSlugs = new Map<string, number>();
  const topics: ParsedTopic[] = topicBlocks.map((block, index) => {
    const baseSlug = slugify(block.title);
    const seen = usedSlugs.get(baseSlug) ?? 0;
    usedSlugs.set(baseSlug, seen + 1);
    const slug = seen === 0 ? baseSlug : `${baseSlug}-${seen + 1}`;

    if (seen > 0) {
      warnings.push(`Duplicate topic heading "${block.title}" was given the slug "${slug}".`);
    }

    const headingPath = `${title} > ${block.title}`;
    const chunks = chunkBody(block.lines.join("\n")).map((content) => ({
      headingPath,
      content,
      wordCount: countWords(content),
    }));

    if (chunks.length === 0) {
      warnings.push(`Topic "${block.title}" has no body text.`);
    }

    return {
      slug,
      title: block.title,
      position: index + 1,
      chunks,
    };
  });

  const chunks = topics.flatMap((topic) => topic.chunks);

  return {
    title,
    topics,
    wordCount: chunks.reduce((total, chunk) => total + chunk.wordCount, 0),
    chunkCount: chunks.length,
    warnings,
  };
}
