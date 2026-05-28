import { Knowledge, KnowledgeStatus } from "@prisma/client";
import { prisma } from "./db";
import { embedText, cosineSimilarity, parseEmbedding } from "./ai";
import { parseTags } from "./utils";

export type SearchMode = "keyword" | "semantic" | "hybrid";

export interface SearchResult {
  item: Knowledge;
  score: number;
  matchType: string;
}

function keywordScore(item: Knowledge, query: string): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const content = item.content.toLowerCase();
  const tags = parseTags(item.tags).join(" ").toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 3;
  if (content.includes(q)) score += 1.5;
  if (tags.includes(q)) score += 2;
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  for (const w of words) {
    if (title.includes(w)) score += 0.5;
    if (content.includes(w)) score += 0.3;
  }
  return score;
}

export async function searchKnowledge(params: {
  query?: string;
  tags?: string[];
  status?: KnowledgeStatus;
  category?: string;
  mode?: SearchMode;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query = "", tags = [], status, category, mode = "hybrid", limit = 20 } = params;

  const where: {
    status?: KnowledgeStatus;
    category?: string;
  } = {};
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

  if (!query.trim()) {
    return items.slice(0, limit).map((item) => ({ item, score: 1, matchType: "list" }));
  }

  const queryEmbedding =
    mode === "semantic" || mode === "hybrid" ? await embedText(query) : null;

  const results: SearchResult[] = items.map((item) => {
    let score = 0;
    let matchType = "keyword";

    if (mode === "keyword" || mode === "hybrid") {
      score += keywordScore(item, query);
    }

    if (queryEmbedding && (mode === "semantic" || mode === "hybrid")) {
      const itemEmb = parseEmbedding(item.embedding);
      if (itemEmb) {
        const sim = cosineSimilarity(queryEmbedding, itemEmb);
        score += sim * 5;
        if (sim > 0.3) matchType = mode === "hybrid" ? "hybrid" : "semantic";
      }
    }

    return { item, score, matchType };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function indexKnowledgeEmbedding(id: string): Promise<void> {
  const item = await prisma.knowledge.findUnique({ where: { id } });
  if (!item) return;
  const text = `${item.title}\n${item.summary ?? ""}\n${item.content}`;
  const embedding = await embedText(text);
  if (embedding) {
    await prisma.knowledge.update({
      where: { id },
      data: { embedding: JSON.stringify(embedding) },
    });
  }
}

export function buildContextFromResults(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] 《${r.item.title}》\n${r.item.summary ?? ""}\n${r.item.content.slice(0, 800)}`,
    )
    .join("\n\n---\n\n");
}
