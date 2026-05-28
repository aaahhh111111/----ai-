"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  bySource: { source: string; _count: number }[];
  topUsed: { id: string; title: string; useCount: number; viewCount: number }[];
  tagStats: { tag: string; count: number }[];
  trend: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <p className="text-slate-400">加载中...</p>;
  }

  const sourceData = stats.bySource.map((s) => ({
    name: s.source,
    count: s._count,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">热度统计</h2>
        <p className="text-sm text-slate-500">知识使用、标签分布与近 7 日活跃趋势</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">知识总量</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">可用 / 不可用</p>
          <p className="text-3xl font-bold">
            {stats.active} / {stats.inactive}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">近 7 日操作</p>
          <p className="text-3xl font-bold">
            {stats.trend.reduce((a, b) => a + b.count, 0)}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">引用热度 TOP</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topUsed} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="title" width={75} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="useCount" fill="#2563eb" name="引用次数" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">标签分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tagStats}>
                <XAxis dataKey="tag" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold">近 7 日使用趋势</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold">知识来源分布</h3>
          <div className="flex flex-wrap gap-4">
            {sourceData.map((s) => (
              <div key={s.name} className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">{s.name}</p>
                <p className="text-xl font-bold">{s.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
