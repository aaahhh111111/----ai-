export interface ContentChunk {
  knowledgeId: string;
  title: string;
  chunkIndex: number;
  anchor: string;
  text: string;
}

const MIN_CHUNK = 24;
const MAX_CHUNK = 480;

export function splitContentToChunks(
  knowledgeId: string,
  title: string,
  content: string,
): ContentChunk[] {
  const rawParts = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const parts: string[] = [];
  for (const part of rawParts.length > 0 ? rawParts : [content.trim()]) {
    if (part.length <= MAX_CHUNK) {
      parts.push(part);
      continue;
    }
    const sentences = part.split(/(?<=[。！？；\n])/);
    let buf = "";
    for (const s of sentences) {
      if ((buf + s).length > MAX_CHUNK && buf.length >= MIN_CHUNK) {
        parts.push(buf.trim());
        buf = s;
      } else {
        buf += s;
      }
    }
    if (buf.trim()) parts.push(buf.trim());
  }

  if (parts.length === 0 && content.trim()) {
    parts.push(content.trim().slice(0, MAX_CHUNK));
  }

  return parts.map((text, chunkIndex) => ({
    knowledgeId,
    title,
    chunkIndex,
    anchor: `para-${chunkIndex}`,
    text,
  }));
}
