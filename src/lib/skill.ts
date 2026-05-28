import { Knowledge } from "@prisma/client";
import { parseTags } from "./utils";

export function exportSkillMarkdown(agentName: string, knowledges: Knowledge[]): string {
  const sections = knowledges.map((k) => {
    const tags = parseTags(k.tags).join(", ");
    return `## ${k.title}\n\n**标签**: ${tags}\n\n${k.content}\n`;
  });

  return `# ${agentName} — Cursor Agent Skill

> 由 AI 知识库管理平台一键导出，供 Cursor / 其他 Agent 平台使用。

## 使用说明

将本文件保存为 \`.cursor/skills/<skill-name>/SKILL.md\`，或在对话中 @ 引用本技能。

## 知识库内容

${sections.join("\n")}
`;
}
