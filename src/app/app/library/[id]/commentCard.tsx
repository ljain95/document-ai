"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";
import type { Highlight } from "@/constants/documentState";
import { HIGHLIGHT_COLOR_STYLES } from "./highlightDom";
import { t } from "@/lib/i18n";

interface CommentCardProps {
  highlight: Highlight;
  // True when the user just clicked this highlight — the card scrolls into
  // view and the textarea is focused.
  active: boolean;
  onCommentChange: (highlightId: string, comment: string) => void;
  onRemove: (highlightId: string) => void;
}

// Hard cap matches MAX_STATE_BYTES headroom so a single comment can't
// single-handedly overflow the JSONB slot.
const COMMENT_MAX_LENGTH = 4000;

// One comment attached to one highlight. Fully controlled — the highlights
// array on the parent is the single source of truth; each keystroke calls
// onCommentChange and React re-renders this card with the new value. Network
// persistence is debounced one level up in PdfReader.
export function CommentCard({
  highlight,
  active,
  onCommentChange,
  onRemove,
}: CommentCardProps) {
  const dict = t().app.library.reader;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const value = highlight.comment ?? "";

  // Auto-size the textarea to fit content. Runs whenever the rendered value
  // changes — measure then set, so the height tracks long pastes too.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // When the user just clicked the underlying highlight, surface this card.
  // We only scroll it into view — focusing the textarea was disorienting
  // (the keyboard would steal away from the page on every highlight tap).
  useEffect(() => {
    if (!active) return;
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [active]);

  const colorStyles = HIGHLIGHT_COLOR_STYLES[highlight.color];

  return (
    <div
      ref={containerRef}
      className={`group relative rounded-md border bg-white px-3 py-2.5 text-sm shadow-sm transition-shadow ${active ? "ring-2 ring-neutral-900/40 ring-offset-1" : "hover:shadow-md"}`}
    >
      {/* Colour spine on the left so the card visually inherits the
          highlight's identity. */}
      <span
        aria-hidden
        className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${colorStyles.swatch}`}
      />
      <button
        type="button"
        onClick={() => onRemove(highlight.id)}
        aria-label={dict.deleteComment}
        className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-900 group-hover:opacity-100 focus:opacity-100"
      >
        <XIcon className="size-3.5" />
      </button>

      <blockquote className="ml-2 mb-2 line-clamp-3 border-l-2 border-neutral-200 pl-2 text-xs italic text-neutral-500">
        “{highlight.text}”
      </blockquote>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          if (e.target.value.length > COMMENT_MAX_LENGTH) return;
          onCommentChange(highlight.id, e.target.value);
        }}
        placeholder={dict.addCommentPlaceholder}
        rows={1}
        className="ml-2 block w-[calc(100%-0.5rem)] resize-none border-0 bg-transparent p-0 text-sm leading-snug text-neutral-800 outline-none placeholder:text-neutral-400"
      />
    </div>
  );
}
