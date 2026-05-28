import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KnowledgeStatus } from "@prisma/client";

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, tagFilter, systemPrompt } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  }

  const defaultPrompt =
    systemPrompt?.trim() ||
    `你是「${name}」领域专家，仅根据知识库内容回答问题，无依据时明确说明。`;

  const agent = await prisma.agent.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      systemPrompt: defaultPrompt,
      tagFilter: tagFilter ? JSON.stringify(tagFilter) : null,
    },
  });

  return NextResponse.json(agent, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { action, tag, name, description } = await req.json();

  if (action === "generate-from-kb") {
    const tagFilter = tag ? [tag] : [];
    const knowledges = await prisma.knowledge.findMany({
      where: { status: KnowledgeStatus.ACTIVE },
      take: 50,
    });
    const filtered = tag
      ? knowledges.filter((k) => k.tags.includes(tag))
      : knowledges;

    const domain = tag || "企业综合";
    const agent = await prisma.agent.create({
      data: {
        name: name || `${domain} 专家 Agent`,
        description:
          description ||
          `基于知识库一键生成，覆盖 ${filtered.length} 条${domain}相关知识`,
        systemPrompt: `你是字节跳动 ${domain} 领域的企业知识专家。回答必须基于提供的知识库片段，引用时注明条目标题。不确定时请建议联系对应职能部门。`,
        tagFilter: tagFilter.length ? JSON.stringify(tagFilter) : null,
      },
    });
    return NextResponse.json({ agent, knowledgeCount: filtered.length });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
