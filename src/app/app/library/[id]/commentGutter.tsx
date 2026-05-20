"use client";

import { useMemo } from "react";
import type { Highlight } from "@/constants/documentState";
import { CommentCard } from "./commentCard";

interface CommentGutterProps {
  pageNumber: number;
  highlights: Highlight[];
  // ID of the highlight whose card should be auto-focused/scrolled — set by
  // the parent when the user clicks an existing highlight.
  activeHighlightId: string | null;
  onCommentChange: (highlightId: string, comment: string) => void;
  onRemove: (highlightId: string) => void;
}

// Right-hand column showing one card per highlight on a given page. Cards
// stack in reading order (by `start` offset, which roughly tracks vertical
// position in the page text). Gutter has a fixed width on md+; hidden on
// narrow screens (the popover is enough on mobile).
export function CommentGutter({
  pageNumber,
  highlights,
  activeHighlightId,
  onCommentChange,
  onRemove,
}: CommentGutterProps) {
  const onPage = useMemo(
    () =>
      highlights
        .filter((h) => h.page === pageNumber)
        .sort((a, b) => a.start - b.start),
    [highlights, pageNumber],
  );

  if (onPage.length === 0) {
    // Reserve no width when there's nothing to show — the page stays
    // centered in the scroll area.
    return null;
  }

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col gap-2">
      {onPage.map((h) => (
        <CommentCard
          key={h.id}
          highlight={h}
          active={activeHighlightId === h.id}
          onCommentChange={onCommentChange}
          onRemove={onRemove}
        />
      ))}
    </aside>
  );
}
