import { NextRequest, NextResponse } from "next/server";
import { KnowledgeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { indexKnowledgeEmbedding } from "@/lib/search";
import { stringifyTags } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await prisma.knowledge.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await prisma.knowledge.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
  await prisma.usageLog.create({
    data: { knowledgeId: id, action: "view" },
  });

  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const existing = await prisma.knowledge.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const item = await prisma.knowledge.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.content !== undefined && { content: String(body.content).trim() }),
      ...(body.summary !== undefined && { summary: body.summary?.trim() }),
      ...(body.tags !== undefined && { tags: stringifyTags(body.tags) }),
      ...(body.status !== undefined && { status: body.status as KnowledgeStatus }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.mediaType !== undefined && { mediaType: body.mediaType }),
      ...(body.mediaUrl !== undefined && { mediaUrl: body.mediaUrl }),
    },
  });

  await indexKnowledgeEmbedding(id);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.knowledge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
