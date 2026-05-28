"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Download, Wand2 } from "lucide-react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  tagFilter: string | null;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("采购");
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/agents");
    setAgents(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function generateAgent() {
    const res = await fetch("/api/agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-from-kb", tag: tag || undefined, name }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`已生成「${data.agent.name}」，关联 ${data.knowledgeCount} 条知识`);
      load();
    }
  }

  function exportSkill() {
    const params = new URLSearchParams({ name: "企业知识Skill" });
    if (tag) params.set("tag", tag);
    window.open(`/api/skill/export?${params}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Agent 与 Skill</h2>
        <p className="text-sm text-slate-500">一键生成专家 Agent · 导出 Cursor Skill</p>
      </div>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold">
          <Wand2 className="h-5 w-5 text-amber-600" />
          一键生成专家 Agent
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          按标签筛选知识库，自动生成带系统提示词的专家 Agent。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input placeholder="Agent 名称（可选）" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="标签筛选，如：采购" value={tag} onChange={(e) => setTag(e.target.value)} />
          <Button onClick={generateAgent}>生成 Agent</Button>
        </div>
        {msg && <p className="mt-3 text-sm text-emerald-600">{msg}</p>}
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold">
          <Download className="h-5 w-5 text-blue-600" />
          导出 Skill（方式二：知识消费）
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          将知识库导出为 Markdown Skill，可在 Cursor 等 Agent 平台使用。
        </p>
        <Button className="mt-4" variant="secondary" onClick={exportSkill}>
          下载 SKILL.md
        </Button>
      </Card>

      <div className="space-y-3">
        {agents.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="rounded-lg bg-amber-50 p-2">
                  <Bot className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="text-sm text-slate-500">{a.description}</p>
                  {a.tagFilter && (
                    <Badge className="mt-2">标签: {a.tagFilter}</Badge>
                  )}
                </div>
              </div>
              <Link href="/chat">
                <Button variant="secondary">去对话</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
