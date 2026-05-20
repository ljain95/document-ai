"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Highlight } from "@/constants/documentState";
import { CommentCard } from "./commentCard";
import { format, t } from "@/lib/i18n";

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlights: Highlight[];
  // Jump-to-page closes the sheet and scrolls the reader to that page. The
  // sheet doesn't track which highlight was tapped — the user can scroll
  // from there.
  onJumpToPage: (page: number) => void;
  onCommentChange: (highlightId: string, comment: string) => void;
  onRemove: (highlightId: string) => void;
}

// Mobile-only counterpart to the desktop CommentGutter — same cards, but
// surfaced through a side-sheet because the gutter has nowhere to live on a
// narrow screen. List is global (every highlight in the document) so the
// user can jump around without having to scroll the PDF first.
export function CommentsSheet({
  open,
  onOpenChange,
  highlights,
  onJumpToPage,
  onCommentChange,
  onRemove,
}: CommentsSheetProps) {
  const dict = t().app.library.reader;

  const sorted = useMemo(
    () =>
      [...highlights].sort((a, b) =>
        a.page === b.page ? a.start - b.start : a.page - b.page,
      ),
    [highlights],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{dict.commentsTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-6 pb-8">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <p className="text-sm font-medium text-neutral-900">
                {dict.commentsEmpty}
              </p>
              <p className="text-xs text-neutral-500">
                {dict.commentsEmptyDescription}
              </p>
            </div>
          ) : (
            sorted.map((h) => (
              <div key={h.id} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onJumpToPage(h.page);
                    onOpenChange(false);
                  }}
                  className="self-start text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-900"
                >
                  {format(dict.goToPage, { page: String(h.page) })}
                </button>
                <CommentCard
                  highlight={h}
                  active={false}
                  onCommentChange={onCommentChange}
                  onRemove={onRemove}
                />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
