"use client";

import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChunkReference {
  refIndex: number;
  knowledgeId: string;
  title: string;
  chunkIndex: number;
  anchor: string;
  excerpt: string;
  content: string;
  score: number;
}

export function SourcePanel({
  reference,
  onClose,
}: {
  reference: ChunkReference;
  onClose: () => void;
}) {
  const knowledgeUrl = `/knowledge?id=${reference.knowledgeId}&para=${reference.chunkIndex}`;

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-xs font-medium text-blue-600">引用 [{reference.refIndex}]</p>
          <h3 className="font-semibold text-slate-900">{reference.title}</h3>
          <p className="text-xs text-slate-500">段落 {reference.chunkIndex + 1}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-slate-100"
          aria-label="关闭"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50/80 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {reference.content}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 p-4">
        <Link href={knowledgeUrl}>
          <Button variant="secondary" className="w-full">
            <ExternalLink className="h-4 w-4" />
            在知识库中查看完整原文
          </Button>
        </Link>
      </div>
    </div>
  );
}
