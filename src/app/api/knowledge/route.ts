import { NextRequest, NextResponse } from "next/server";
import { KnowledgeSource, KnowledgeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { indexKnowledgeEmbedding } from "@/lib/search";
import { stringifyTags } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as KnowledgeStatus | null;
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");

  const items = await prisma.knowledge.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = tag
    ? items.filter((i) => i.tags.includes(tag))
    : items;

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    content,
    summary,
    tags = [],
    status = "ACTIVE",
    source = "MANUAL",
    category,
    mediaType = "text",
    mediaUrl,
  } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
  }

  const item = await prisma.knowledge.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      summary: summary?.trim(),
      tags: stringifyTags(tags),
      status: status as KnowledgeStatus,
      source: source as KnowledgeSource,
      category: category?.trim(),
      mediaType,
      mediaUrl,
    },
  });

  await indexKnowledgeEmbedding(item.id);
  await prisma.usageLog.create({
    data: { knowledgeId: item.id, action: "create" },
  });

  return NextResponse.json(item, { status: 201 });
}
