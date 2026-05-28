import { NextRequest, NextResponse } from "next/server";
import { KnowledgeSource, KnowledgeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { chatCompletion, learnFromConversation } from "@/lib/ai";
import { buildContextFromResults, indexKnowledgeEmbedding, searchKnowledge } from "@/lib/search";
import { stringifyTags } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { sessionId, agentId, message, autoLearn = false } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  let session = sessionId
    ? await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { agent: true, messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      })
    : null;

  if (!session) {
    const agent = agentId
      ? await prisma.agent.findUnique({ where: { id: agentId } })
      : await prisma.agent.findFirst();
    if (!agent) {
      return NextResponse.json({ error: "请先创建专家 Agent" }, { status: 400 });
    }
    session = await prisma.chatSession.create({
      data: { agentId: agent.id, title: message.slice(0, 30) },
      include: { agent: true, messages: true },
    });
  }

  const tagFilter = session.agent.tagFilter
    ? (JSON.parse(session.agent.tagFilter) as string[])
    : [];

  const results = await searchKnowledge({
    query: message,
    tags: tagFilter,
    status: KnowledgeStatus.ACTIVE,
    mode: "hybrid",
    limit: 5,
  });

  for (const r of results) {
    await prisma.knowledge.update({
      where: { id: r.item.id },
      data: { useCount: { increment: 1 } },
    });
  }

  const context = buildContextFromResults(results);
  const history = session.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const systemContent = `${session.agent.systemPrompt}

以下是与问题相关的知识库片段，请优先依据这些内容回答：
${context || "（未检索到相关知识）"}`;

  const reply = await chatCompletion([
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: message },
  ]);

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: session.id, role: "user", content: message },
      { sessionId: session.id, role: "assistant", content: reply },
    ],
  });

  await prisma.usageLog.create({
    data: {
      action: "chat",
      metadata: JSON.stringify({
        sessionId: session.id,
        refs: results.map((r) => r.item.id),
      }),
    },
  });

  let learned: { id: string; title: string } | null = null;
  if (autoLearn) {
    const extracted = await learnFromConversation(message, reply);
    if (extracted) {
      const item = await prisma.knowledge.create({
        data: {
          title: extracted.title,
          content: extracted.content,
          tags: stringifyTags(extracted.tags),
          source: KnowledgeSource.CHAT_LEARN,
          status: KnowledgeStatus.ACTIVE,
          summary: extracted.content.slice(0, 120),
        },
      });
      await indexKnowledgeEmbedding(item.id);
      learned = { id: item.id, title: item.title };
    }
  }

  return NextResponse.json({
    sessionId: session.id,
    reply,
    references: results.map((r) => ({
      id: r.item.id,
      title: r.item.title,
      score: r.score,
    })),
    learned,
    demoMode: !process.env.OPENAI_API_KEY,
  });
}
