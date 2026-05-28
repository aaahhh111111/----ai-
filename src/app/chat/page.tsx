"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { SourcePanel, type ChunkReference } from "@/components/chat/source-panel";

interface Agent {
  id: string;
  name: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  references?: ChunkReference[];
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
  const [activeRef, setActiveRef] = useState<ChunkReference | null>(null);
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
    setActiveRef(null);
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
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">专家对话</h2>
          <p className="text-sm text-slate-500">
            段落级引用 · 点击 [1][2] 查看原文（对标 ima 引文溯源）
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              setSessionId(null);
              setMessages([]);
              setActiveRef(null);
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

      <div className="flex min-h-0 flex-1 gap-0">
        <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
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
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.references && m.references.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-medium text-slate-500">
                        引用来源（点击查看段落原文）
                      </p>
                      <div className="space-y-2">
                        {m.references.map((r) => (
                          <button
                            key={`${r.knowledgeId}-${r.anchor}`}
                            type="button"
                            onClick={() => setActiveRef(r)}
                            className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                              activeRef?.refIndex === r.refIndex &&
                              activeRef?.knowledgeId === r.knowledgeId
                                ? "border-blue-400 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
                              {r.refIndex}
                            </span>
                            <span className="font-medium text-slate-800">{r.title}</span>
                            <span className="ml-1 text-xs text-slate-400">
                              · 第 {r.chunkIndex + 1} 段
                            </span>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {r.excerpt}
                            </p>
                          </button>
                        ))}
                      </div>
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

        {activeRef && (
          <div className="hidden w-80 shrink-0 md:block">
            <SourcePanel reference={activeRef} onClose={() => setActiveRef(null)} />
          </div>
        )}
      </div>

      {activeRef && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setActiveRef(null)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl bg-white shadow-xl">
            <SourcePanel reference={activeRef} onClose={() => setActiveRef(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
