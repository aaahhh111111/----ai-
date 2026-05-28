"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { FileUp, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ProducePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; id: string } | null>(null);

  async function extract() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, useAi: true }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult({ title: data.title, id: data.id });
  }

  async function uploadFile(file: File) {
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    form.append("useAi", "true");
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult({ title: data.title, id: data.id });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">知识生产</h2>
        <p className="text-sm text-slate-500">支持手动录入、文档导入、AI 自动提炼</p>
      </div>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-violet-600" />
          AI 提炼
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          粘贴会议纪要、制度原文或对话记录，自动提炼为结构化知识条目。
        </p>
        <Textarea
          className="mt-4"
          rows={8}
          placeholder="粘贴待提炼的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button className="mt-3" disabled={loading || !text.trim()} onClick={extract}>
          {loading ? "提炼中..." : "AI 提炼并入库"}
        </Button>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 font-semibold">
          <FileUp className="h-5 w-5 text-blue-600" />
          文档 / 图片导入
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          支持 .txt、.md、.csv 等文本文件；图片将记录为多模态条目（需 AI 配置以深度理解）。
        </p>
        <input
          type="file"
          className="mt-4 block w-full text-sm"
          accept=".txt,.md,.csv,.json,text/*,image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
          }}
        />
      </Card>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-emerald-800">
            已入库：「{result.title}」
            <Link href="/knowledge" className="ml-2 underline">
              查看知识库
            </Link>
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm text-slate-600">
          也可在
          <Link href="/knowledge" className="mx-1 text-blue-600 underline">
            知识管理
          </Link>
          中手动创建；在
          <Link href="/chat" className="mx-1 text-blue-600 underline">
            专家对话
          </Link>
          开启「对话沉淀」实现生产闭环。
        </p>
      </Card>
    </div>
  );
}
