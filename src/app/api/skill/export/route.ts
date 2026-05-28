import { NextRequest, NextResponse } from "next/server";
import { KnowledgeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exportSkillMarkdown } from "@/lib/skill";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const name = searchParams.get("name") || "企业知识 Skill";

  const items = await prisma.knowledge.findMany({
    where: { status: KnowledgeStatus.ACTIVE },
    orderBy: { useCount: "desc" },
    take: 100,
  });

  const filtered = tag ? items.filter((k) => k.tags.includes(tag)) : items;
  const markdown = exportSkillMarkdown(name, filtered);

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}.md"`,
    },
  });
}
