import { NextRequest, NextResponse } from "next/server";
import { KnowledgeStatus } from "@prisma/client";
import { searchKnowledge, SearchMode } from "@/lib/search";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const mode = (searchParams.get("mode") ?? "hybrid") as SearchMode;
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const status = searchParams.get("status") as KnowledgeStatus | null;
  const category = searchParams.get("category") ?? undefined;

  const results = await searchKnowledge({
    query: q,
    tags,
    status: status ?? undefined,
    category,
    mode,
    limit: 30,
  });

  if (q.trim()) {
    await prisma.usageLog.create({
      data: { action: "search", metadata: JSON.stringify({ q, mode, count: results.length }) },
    });
  }

  return NextResponse.json(
    results.map((r) => ({
      ...r.item,
      _score: r.score,
      _matchType: r.matchType,
    })),
  );
}
