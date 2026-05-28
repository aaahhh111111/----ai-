"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  references?: { id: string; title: string; score: number }[];
  learned?: { id: string; title: string } | null;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLearn, setAutoLearn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data: Agent[]) => {
        setAgents(data);
        if (data[0]) setAgentId(data[0].id);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, agentId, message: userMsg, autoLearn }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSessionId(data.sessionId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          references: data.references,
          learned: data.learned,
        },
      ]);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">专家对话</h2>
          <p className="text-sm text-slate-500">RAG 检索增强 · 基于知识库回答</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              setSessionId(null);
              setMessages([]);
            }}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoLearn}
              onChange={(e) => setAutoLearn(e.target.checked)}
            />
            对话沉淀
          </label>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-center text-slate-400">
              试试：「采购 5 万以上需要什么审批？」「新员工 IT 账号如何开通？」
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.references && m.references.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <p className="text-xs font-medium text-slate-500">引用知识：</p>
                    {m.references.map((r) => (
                      <Badge key={r.id} variant="muted" className="mr-1 mt-1">
                        {r.title}
                      </Badge>
                    ))}
                  </div>
                )}
                {m.learned && (
                  <p className="mt-2 text-xs text-emerald-600">
                    已自动沉淀：{m.learned.title}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && <p className="text-sm text-slate-400">思考中...</p>}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4">
          <Input
            placeholder="输入问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          />
          <Button onClick={send} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
