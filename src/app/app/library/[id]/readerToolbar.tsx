"use client";

import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { t } from "@/lib/i18n";

interface ReaderToolbarProps {
  page: number;
  numPages: number;
  scale: number;
  minScale: number;
  maxScale: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

// Mirrors the MiniSidebar's chrome (w-16 column, border-r, px-3 py-6) so the
// two sit flush as a single navigation rail. Page nav lives at the top, zoom
// drops to the bottom mt-auto group — same shape as Library / Settings in
// MiniSidebar.
export function ReaderToolbar({
  page,
  numPages,
  scale,
  minScale,
  maxScale,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ReaderToolbarProps) {
  const dict = t().app.library.reader;
  const [input, setInput] = useState(String(page));
  const loaded = numPages > 0;

  useEffect(() => setInput(String(page)), [page]);

  function commit() {
    const n = parseInt(input, 10);
    if (Number.isFinite(n) && n >= 1 && n <= numPages) {
      onPageChange(n);
    } else {
      setInput(String(page));
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex h-full w-16 flex-col items-center border-r bg-background px-3 py-6">
        {/* Page nav — vertically centered in the column (my-auto absorbs the
            space above and below) so the chevrons sit at eye level. Zoom
            falls to the bottom mt-0 group. */}
        <div className="my-auto flex flex-col items-center gap-3">
          <ToolbarIconButton
            icon={ChevronUpIcon}
            label={dict.previousPage}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={!loaded || page <= 1}
          />

          <input
            aria-label={dict.pageInput}
            value={loaded ? input : ""}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            disabled={!loaded}
            className="w-9 rounded-md border bg-white px-1 py-1 text-center text-xs tabular-nums outline-none focus:border-neutral-900 disabled:opacity-40"
          />

          <div className="h-px w-6 bg-neutral-200" />

          <span className="text-[10px] tabular-nums text-neutral-500">
            {loaded ? numPages : "—"}
          </span>

          <ToolbarIconButton
            icon={ChevronDownIcon}
            label={dict.nextPage}
            onClick={() => onPageChange(Math.min(numPages, page + 1))}
            disabled={!loaded || page >= numPages}
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-6 bg-neutral-200" />
          <ToolbarIconButton
            icon={MinusIcon}
            label={dict.zoomOut}
            onClick={onZoomOut}
            disabled={scale <= minScale}
          />
          <ToolbarIconButton
            icon={SearchIcon}
            label={dict.resetZoom}
            onClick={onResetZoom}
          />
          <ToolbarIconButton
            icon={PlusIcon}
            label={dict.zoomIn}
            onClick={onZoomIn}
            disabled={scale >= maxScale}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface ToolbarIconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="inline-flex size-8 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Icon className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
