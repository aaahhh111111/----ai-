import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTags } from "@/lib/utils";

export async function GET() {
  const [total, active, inactive, bySource, topUsed, recentLogs, dailyUsage] =
    await Promise.all([
      prisma.knowledge.count(),
      prisma.knowledge.count({ where: { status: "ACTIVE" } }),
      prisma.knowledge.count({ where: { status: "INACTIVE" } }),
      prisma.knowledge.groupBy({ by: ["source"], _count: true }),
      prisma.knowledge.findMany({
        orderBy: { useCount: "desc" },
        take: 10,
        select: { id: true, title: true, useCount: true, viewCount: true },
      }),
      prisma.usageLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.usageLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
        },
      }),
    ]);

  const tagMap: Record<string, number> = {};
  const all = await prisma.knowledge.findMany({ select: { tags: true } });
  for (const k of all) {
    for (const t of parseTags(k.tags)) {
      tagMap[t] = (tagMap[t] || 0) + 1;
    }
  }
  const tagStats = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const dayMap: Record<string, number> = {};
  for (const log of dailyUsage) {
    const day = log.createdAt.toISOString().slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;
  }
  const trend = Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    total,
    active,
    inactive,
    bySource,
    topUsed,
    tagStats,
    trend,
    recentLogs,
  });
}
