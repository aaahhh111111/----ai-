import { NextRequest, NextResponse } from "next/server";
import { KnowledgeSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extractKnowledgeFromText } from "@/lib/ai";
import { indexKnowledgeEmbedding } from "@/lib/search";
import { stringifyTags } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const useAi = form.get("useAi") !== "false";

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const text = await file.text();
    const isImage = file.type.startsWith("image/");

    if (useAi) {
      const extracted = await extractKnowledgeFromText(
        isImage
          ? `【图片文件: ${file.name}】请根据文件名与上下文生成知识条目说明。`
          : text,
      );
      const item = await prisma.knowledge.create({
        data: {
          title: extracted.title,
          content: extracted.content,
          summary: extracted.summary,
          tags: stringifyTags(extracted.tags),
          source: KnowledgeSource.IMPORT,
          mediaType: isImage ? "image" : "text",
          mediaUrl: isImage ? file.name : undefined,
        },
      });
      await indexKnowledgeEmbedding(item.id);
      return NextResponse.json(item, { status: 201 });
    }

    const item = await prisma.knowledge.create({
      data: {
        title: file.name.replace(/\.[^.]+$/, ""),
        content: text,
        summary: text.slice(0, 120),
        tags: stringifyTags(["导入"]),
        source: KnowledgeSource.IMPORT,
        mediaType: isImage ? "image" : "text",
      },
    });
    await indexKnowledgeEmbedding(item.id);
    return NextResponse.json(item, { status: 201 });
  }

  const { text, useAi = true } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "文本不能为空" }, { status: 400 });
  }

  if (useAi) {
    const extracted = await extractKnowledgeFromText(text);
    const item = await prisma.knowledge.create({
      data: {
        title: extracted.title,
        content: extracted.content,
        summary: extracted.summary,
        tags: stringifyTags(extracted.tags),
        source: KnowledgeSource.AI_EXTRACT,
      },
    });
    await indexKnowledgeEmbedding(item.id);
    return NextResponse.json(item, { status: 201 });
  }

  const item = await prisma.knowledge.create({
    data: {
      title: "导入文本",
      content: text,
      source: KnowledgeSource.IMPORT,
      tags: stringifyTags(["导入"]),
    },
  });
  await indexKnowledgeEmbedding(item.id);
  return NextResponse.json(item, { status: 201 });
}
