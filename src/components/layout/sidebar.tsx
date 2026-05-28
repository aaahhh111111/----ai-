"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  BarChart3,
  Home,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "概览", icon: Home },
  { href: "/knowledge", label: "知识管理", icon: BookOpen },
  { href: "/produce", label: "知识生产", icon: Sparkles },
  { href: "/chat", label: "专家对话", icon: MessageSquare },
  { href: "/agents", label: "Agent 管理", icon: Bot },
  { href: "/analytics", label: "热度统计", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
          CIS · AIGC
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">AI 知识库</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="px-4 py-3 text-xs text-slate-400">集团信息系统部课题 Demo</p>
    </aside>
  );
}
