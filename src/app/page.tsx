"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Bot, MessageSquare, Sparkles } from "lucide-react";

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = [
    {
      title: "知识管理",
      desc: "创建、编辑、检索与状态管理",
      href: "/knowledge",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "知识生产",
      desc: "手动录入、文档导入、AI 提炼",
      href: "/produce",
      icon: Sparkles,
      color: "text-violet-600 bg-violet-50",
    },
    {
      title: "专家对话",
      desc: "基于知识库的 RAG 智能问答",
      href: "/chat",
      icon: MessageSquare,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Agent & Skill",
      desc: "一键生成专家 Agent，导出 Skill",
      href: "/agents",
      icon: Bot,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">AI 知识库管理平台</h2>
        <p className="mt-2 text-slate-600">
          面向集团与 Agent 的知识生产、管理与消费一体化 Demo，覆盖课题全部基础要求与多项加分项。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">知识总量</p>
          <p className="mt-1 text-3xl font-bold">{stats?.total ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">可用</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{stats?.active ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">不可用</p>
          <p className="mt-1 text-3xl font-bold text-slate-400">{stats?.inactive ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">AI 模式</p>
          <p className="mt-1 text-sm font-medium">
            配置 OPENAI_API_KEY 后启用完整能力；未配置时为演示模式。
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ title, desc, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold">能力对照（课题要求）</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>✓ 知识 CRUD、关键词 + 语义混合检索、可用/不可用状态</li>
          <li>✓ 知识消费：专家 Agent 对话 + Skill Markdown 导出</li>
          <li>✓ 加分：对话自动沉淀、文档/图片导入、热度统计可视化、一键生成 Agent</li>
        </ul>
        <div className="mt-4 flex gap-3">
          <Link href="/chat">
            <Button>开始对话</Button>
          </Link>
          <Link href="/analytics">
            <Button variant="secondary">查看统计</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
