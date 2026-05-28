import { Knowledge, KnowledgeStatus } from "@prisma/client";
import { prisma } from "./db";
import { embedText, cosineSimilarity, parseEmbedding } from "./ai";
import { parseTags } from "./utils";
import type { SearchMode } from "./search";
import { splitContentToChunks, type ContentChunk } from "./chunk-utils";

export type { ContentChunk };
export { splitContentToChunks };

export interface ChunkSearchResult {
  chunk: ContentChunk;
  score: number;
  refIndex: number;
}

function chunkKeywordScore(text: string, query: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q.trim()) return 0;
  let score = 0;
  if (t.includes(q)) score += 2;
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  for (const w of words) {
    if (t.includes(w)) score += 0.6;
  }
  return score;
}

export async function searchKnowledgeChunks(params: {
  query: string;
  tags?: string[];
  status?: KnowledgeStatus;
  category?: string;
  mode?: SearchMode;
  limit?: number;
}): Promise<ChunkSearchResult[]> {
  const { query, tags = [], status, category, mode = "hybrid", limit = 6 } = params;

  const where: { status?: KnowledgeStatus; category?: string } = {};
  if (status) where.status = status;
  if (category) where.category = category;

  let items = await prisma.knowledge.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  if (tags.length > 0) {
    items = items.filter((item) => {
      const itemTags = parseTags(item.tags);
      return tags.every((t) => itemTags.some((it) => it.includes(t)));
    });
  }

  const queryEmbedding =
    mode === "semantic" || mode === "hybrid" ? await embedText(query) : null;

  const scored: { chunk: ContentChunk; score: number }[] = [];

  for (const item of items) {
    const chunks = splitContentToChunks(item.id, item.title, item.content);
    let docSemantic = 0;
    if (queryEmbedding) {
      const itemEmb = parseEmbedding(item.embedding);
      if (itemEmb) docSemantic = cosineSimilarity(queryEmbedding, itemEmb) * 2;
    }

    for (const chunk of chunks) {
      let score = docSemantic * 0.3;
      if (mode === "keyword" || mode === "hybrid") {
        score += chunkKeywordScore(chunk.text, query);
        if (item.title.toLowerCase().includes(query.toLowerCase())) score += 0.4;
      }
      if (score > 0) scored.push({ chunk, score });
    }
  }

  let top = scored.sort((a, b) => b.score - a.score).slice(0, limit);

  if (top.length === 0 && query.trim()) {
    const fallback: { chunk: ContentChunk; score: number }[] = [];
    for (const item of items.slice(0, 5)) {
      const chunks = splitContentToChunks(item.id, item.title, item.content);
      for (const chunk of chunks.slice(0, 2)) {
        fallback.push({ chunk, score: 0.1 });
      }
    }
    top = fallback.slice(0, limit);
  }

  return top.map((item, i) => ({
    ...item,
    refIndex: i + 1,
  }));
}

export function buildContextFromChunks(results: ChunkSearchResult[]): string {
  return results
    .map(
      ({ refIndex, chunk }) =>
        `[${refIndex}] 《${chunk.title}》${chunk.anchor}\n${chunk.text}`,
    )
    .join("\n\n---\n\n");
}

export function toChunkReferences(results: ChunkSearchResult[]) {
  return results.map(({ refIndex, chunk, score }) => ({
    refIndex,
    knowledgeId: chunk.knowledgeId,
    title: chunk.title,
    chunkIndex: chunk.chunkIndex,
    anchor: chunk.anchor,
    excerpt: chunk.text.length > 160 ? `${chunk.text.slice(0, 160)}…` : chunk.text,
    content: chunk.text,
    score,
  }));
}

