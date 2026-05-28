"use client";

import { useEffect, useRef } from "react";
import { splitContentToChunks } from "@/lib/chunk-utils";

export function ParagraphView({
  knowledgeId,
  title,
  content,
  highlightIndex,
}: {
  knowledgeId: string;
  title: string;
  content: string;
  highlightIndex?: number | null;
}) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const chunks = splitContentToChunks(knowledgeId, title, content);

  useEffect(() => {
    if (highlightIndex == null) return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightIndex, knowledgeId]);

  if (chunks.length <= 1 && !content.includes("\n\n")) {
    const highlighted = highlightIndex === 0;
    return (
      <div
        ref={highlighted ? highlightRef : undefined}
        id="para-0"
        className={
          highlighted
            ? "rounded-lg border-2 border-amber-300 bg-amber-50 p-4"
            : "text-sm text-slate-700"
        }
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chunks.map((chunk) => {
        const highlighted = highlightIndex === chunk.chunkIndex;
        return (
          <div
            key={chunk.anchor}
            id={chunk.anchor}
            ref={highlighted ? highlightRef : undefined}
            className={`rounded-lg p-3 text-sm leading-relaxed ${
              highlighted
                ? "border-2 border-amber-300 bg-amber-50 text-slate-800"
                : "border border-transparent text-slate-700"
            }`}
          >
            <span className="mb-1 block text-xs text-slate-400">
              段落 {chunk.chunkIndex + 1}
            </span>
            <p className="whitespace-pre-wrap">{chunk.text}</p>
          </div>
        );
      })}
    </div>
  );
}
