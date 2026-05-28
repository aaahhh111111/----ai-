import OpenAI from "openai";

export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient(): OpenAI | null {
  if (!isAiEnabled()) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

export function getChatModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
}

export async function embedText(text: string): Promise<number[] | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  const res = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: text.slice(0, 8000),
  });
  return res.data[0]?.embedding ?? null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function parseEmbedding(stored: string | null): number[] | null {
  if (!stored) return null;
  try {
    return JSON.parse(stored) as number[];
  } catch {
    return null;
  }
}

export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return `【演示模式】已收到您的问题：「${lastUser?.content ?? ""}」。请配置 OPENAI_API_KEY 后启用真实 AI 回答。下方检索结果仍来自知识库。`;
  }
  const res = await client.chat.completions.create({
    model: getChatModel(),
    messages,
    temperature: 0.3,
  });
  return res.choices[0]?.message?.content?.trim() ?? "暂无回复";
}

export async function extractKnowledgeFromText(
  raw: string,
): Promise<{ title: string; summary: string; content: string; tags: string[] }> {
  const client = getOpenAIClient();
  if (!client) {
    const lines = raw.trim().split("\n").filter(Boolean);
    const title = lines[0]?.slice(0, 50) || "未命名知识";
    return {
      title,
      summary: raw.slice(0, 120),
      content: raw,
      tags: ["导入", "演示"],
    };
  }
  const res = await client.chat.completions.create({
    model: getChatModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          '你是知识提炼助手。将用户文本整理为 JSON：{"title":"","summary":"","content":"","tags":[]}。content 为结构化正文，tags 为 2-5 个中文标签。',
      },
      { role: "user", content: raw.slice(0, 12000) },
    ],
    response_format: { type: "json_object" },
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text) as {
      title?: string;
      summary?: string;
      content?: string;
      tags?: string[];
    };
    return {
      title: parsed.title || "AI 提炼知识",
      summary: parsed.summary || "",
      content: parsed.content || raw,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    };
  } catch {
    return {
      title: "AI 提炼知识",
      summary: raw.slice(0, 120),
      content: raw,
      tags: ["AI提炼"],
    };
  }
}

export async function learnFromConversation(
  question: string,
  answer: string,
): Promise<{ title: string; content: string; tags: string[] } | null> {
  if (!isAiEnabled()) return null;
  const client = getOpenAIClient();
  if (!client) return null;
  const res = await client.chat.completions.create({
    model: getChatModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          '判断对话是否包含可复用的企业知识。若无价值返回 {"skip":true}；否则返回 {"skip":false,"title":"","content":"","tags":[]}。',
      },
      {
        role: "user",
        content: `用户问：${question}\n助手答：${answer}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      skip?: boolean;
      title?: string;
      content?: string;
      tags?: string[];
    };
    if (parsed.skip || !parsed.content) return null;
    return {
      title: parsed.title || "对话沉淀知识",
      content: parsed.content,
      tags: parsed.tags ?? ["对话学习"],
    };
  } catch {
    return null;
  }
}
