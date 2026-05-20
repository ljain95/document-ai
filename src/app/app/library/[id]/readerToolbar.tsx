"use client";

import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  MessageSquareIcon,
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
  // Mobile-only: opens the CommentsSheet. Desktop has the inline gutter, so
  // the button is hidden on md+.
  onOpenComments?: () => void;
}

// Responsive: top bar on mobile (< md), left sidebar on md+. The flex
// direction and dividers flip with the `md:` breakpoint; the prev/next
// chevrons swap horizontal-vs-vertical via per-icon visibility classes so
// no JS / useMediaQuery hook is needed.
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
  onOpenComments,
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
      <aside
        className={
          "flex w-full flex-row items-center justify-center gap-6 border-b bg-background px-4 py-2 " +
          "md:h-full md:w-16 md:flex-col md:justify-start md:gap-3 md:border-b-0 md:border-r md:px-3 md:py-6"
        }
      >
        {/* Page nav group — sits in a single centered cluster with zoom on
            mobile (justify-center on parent), vertically centered as its own
            group on desktop (my-auto). */}
        <div className="flex flex-row items-center gap-2 md:my-auto md:flex-col md:gap-3">
          <ToolbarIconButton
            label={dict.previousPage}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={!loaded || page <= 1}
          >
            <ChevronLeftIcon className="size-5 md:hidden" />
            <ChevronUpIcon className="hidden size-5 md:block" />
          </ToolbarIconButton>

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

          <div className="h-6 w-px bg-neutral-200 md:h-px md:w-6" />

          <span className="text-[11px] tabular-nums text-neutral-500 md:text-[10px]">
            {loaded ? numPages : "—"}
          </span>

          <ToolbarIconButton
            label={dict.nextPage}
            onClick={() => onPageChange(Math.min(numPages, page + 1))}
            disabled={!loaded || page >= numPages}
          >
            <ChevronRightIcon className="size-5 md:hidden" />
            <ChevronDownIcon className="hidden size-5 md:block" />
          </ToolbarIconButton>
        </div>

        {/* Zoom group — part of the centered cluster on mobile, falls to the
            bottom of the column on desktop (kept in normal flow after the
            my-auto page nav). */}
        <div className="flex flex-row items-center gap-2 md:flex-col md:gap-3">
          <div className="hidden h-px w-6 bg-neutral-200 md:block" />
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

        {/* Mobile-only: opens the CommentsSheet. Hidden on md+ since the
            desktop layout already shows the gutter inline. */}
        {onOpenComments && (
          <div className="flex flex-row items-center gap-2 md:hidden">
            <div className="h-6 w-px bg-neutral-200" />
            <ToolbarIconButton
              icon={MessageSquareIcon}
              label={dict.openComments}
              onClick={onOpenComments}
            />
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

interface ToolbarIconButtonProps {
  // Either a single icon component (zoom buttons) or custom children for
  // buttons that need to render different icons per breakpoint (prev/next).
  icon?: LucideIcon;
  children?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarIconButton({
  icon: Icon,
  children,
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
          {Icon ? <Icon className="size-5" /> : children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
