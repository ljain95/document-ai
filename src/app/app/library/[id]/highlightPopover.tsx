"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Trash2Icon } from "lucide-react";
import {
  HIGHLIGHT_COLOR_IDS,
  type HighlightColor,
} from "@/constants/documentState";
import { HIGHLIGHT_COLOR_STYLES } from "./highlightDom";
import { t } from "@/lib/i18n";

interface HighlightPopoverProps {
  // Viewport-coord rect to anchor against — what Range.getBoundingClientRect
  // or HTMLElement.getBoundingClientRect returns.
  anchor: DOMRect;
  // "create" = fresh selection (only colour swatches); "remove" = existing
  // highlight clicked (swatches recolour, plus a trash button).
  mode: "create" | "remove";
  // Currently-applied colour in "remove" mode, so the active swatch can be
  // ringed. Ignored in "create" mode (selection has no colour yet).
  activeColor?: HighlightColor;
  onSelectColor: (color: HighlightColor) => void;
  onRemove?: () => void;
}

const VERTICAL_OFFSET = 8;
const VIEWPORT_PAD = 8;

// Tiny floating toolbar attached to a selection or highlight. Uses position:
// fixed (viewport coords) because the reader scrolls inside its own
// container, not the window — the parent dismisses the popover on scroll
// rather than tracking the anchor live.
export function HighlightPopover({
  anchor,
  mode,
  activeColor,
  onSelectColor,
  onRemove,
}: HighlightPopoverProps) {
  const dict = t().app.library.reader;
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
  }, [mode]);

  // Above the anchor by default; flip below if it would clip the top.
  const top =
    anchor.top - size.h - VERTICAL_OFFSET < VIEWPORT_PAD
      ? anchor.bottom + VERTICAL_OFFSET
      : anchor.top - size.h - VERTICAL_OFFSET;
  const left = Math.max(
    VIEWPORT_PAD,
    Math.min(
      window.innerWidth - size.w - VIEWPORT_PAD,
      anchor.left + anchor.width / 2 - size.w / 2,
    ),
  );

  // Pass coordinates through CSS variables and reference them via Tailwind
  // arbitrary-value utilities — matches the codebase's "no style prop" rule
  // (CSS vars are the documented escape hatch for runtime-dynamic values).
  const positionVars = {
    "--popover-top": `${top}px`,
    "--popover-left": `${left}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      role="toolbar"
      style={positionVars}
      className="fixed z-50 top-[var(--popover-top)] left-[var(--popover-left)] flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 shadow-lg"
      // Prevent mousedown from collapsing the selection before our click
      // handler runs — without this, clicking a swatch deselects first.
      onMouseDown={(e) => e.preventDefault()}
    >
      {HIGHLIGHT_COLOR_IDS.map((color) => {
        const isActive = mode === "remove" && activeColor === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelectColor(color)}
            aria-label={dict.highlightColors[color]}
            aria-pressed={isActive}
            className={`size-4 rounded-full transition-transform hover:scale-110 ${HIGHLIGHT_COLOR_STYLES[color].swatch} ${isActive ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white" : "ring-1 ring-black/10"}`}
          />
        );
      })}
      {mode === "remove" && onRemove && (
        <>
          <span className="mx-1 h-5 w-px bg-neutral-200" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={dict.removeHighlight}
            className="inline-flex size-6 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Trash2Icon className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
