"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ParagraphView } from "@/components/knowledge/paragraph-view";
import { parseTags } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

interface Knowledge {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string;
  status: "ACTIVE" | "INACTIVE";
  category: string | null;
  source: string;
  viewCount: number;
  useCount: number;
  _score?: number;
}

type FormState = {
  title: string;
  content: string;
  summary: string;
  tags: string;
  status: "ACTIVE" | "INACTIVE";
  category: string;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  summary: "",
  tags: "",
  status: "ACTIVE",
  category: "",
};

function KnowledgePageInner() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const deepLinkPara = searchParams.get("para");

  const [list, setList] = useState<Knowledge[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("hybrid");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Knowledge | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query);
      params.set("mode", mode);
    }
    if (statusFilter) params.set("status", statusFilter);
    const url = query.trim() ? `/api/search?${params}` : `/api/knowledge?${params}`;
    const res = await fetch(url);
    setList(await res.json());
  }, [query, mode, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!deepLinkId) return;
    fetch(`/api/knowledge/${deepLinkId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((item: Knowledge | null) => {
        if (item) setSelected(item);
      });
  }, [deepLinkId]);

  async function save() {
    const tags = form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags };
    const url = editingId ? `/api/knowledge/${editingId}` : "/api/knowledge";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  }

  async function remove(id: string) {
    if (!confirm("确认删除该知识？")) return;
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  function startEdit(item: Knowledge) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      summary: item.summary ?? "",
      tags: parseTags(item.tags).join(", "),
      status: item.status,
      category: item.category ?? "",
    });
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">知识管理</h2>
          <p className="text-sm text-slate-500">创建、编辑、删除与混合检索</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
        >
          <Plus className="h-4 w-4" />
          新建知识
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="关键词 / 语义搜索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-36">
            <option value="hybrid">混合检索</option>
            <option value="keyword">关键词</option>
            <option value="semantic">语义</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32"
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">可用</option>
            <option value="INACTIVE">不可用</option>
          </Select>
          <Button variant="secondary" onClick={load}>
            搜索
          </Button>
        </div>
      </Card>

      {showForm && (
        <Card>
          <h3 className="mb-4 font-semibold">{editingId ? "编辑知识" : "新建知识"}</h3>
          <div className="grid gap-3">
            <Input
              placeholder="标题"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="分类"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="标签，逗号分隔"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <Textarea
              placeholder="摘要"
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
            <Textarea
              placeholder="正文"
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <Select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "ACTIVE" | "INACTIVE" })
              }
            >
              <option value="ACTIVE">可用</option>
              <option value="INACTIVE">不可用</option>
            </Select>
            <div className="flex gap-2">
              <Button onClick={save}>保存</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                取消
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {list.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors ${selected?.id === item.id ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelected(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {item.summary || item.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant={item.status === "ACTIVE" ? "success" : "muted"}>
                      {item.status === "ACTIVE" ? "可用" : "不可用"}
                    </Badge>
                    {parseTags(item.tags).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded p-1 hover:bg-slate-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(item);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    className="rounded p-1 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              {item._score !== undefined && (
                <p className="mt-2 text-xs text-blue-600">相关度 {item._score.toFixed(2)}</p>
              )}
            </Card>
          ))}
          {list.length === 0 && (
            <p className="py-8 text-center text-slate-400">暂无知识，请新建或调整筛选</p>
          )}
        </div>

        {selected && (
          <Card className="lg:sticky lg:top-6 lg:h-fit">
            <h3 className="text-lg font-semibold">{selected.title}</h3>
            <p className="mt-2 text-xs text-slate-400">
              浏览 {selected.viewCount} · 引用 {selected.useCount} · 来源 {selected.source}
            </p>
            <ParagraphView
              knowledgeId={selected.id}
              title={selected.title}
              content={selected.content}
              highlightIndex={
                deepLinkId === selected.id && deepLinkPara != null
                  ? parseInt(deepLinkPara, 10)
                  : null
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-400">加载中...</p>}>
      <KnowledgePageInner />
    </Suspense>
  );
}
