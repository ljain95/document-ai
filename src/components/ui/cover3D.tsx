"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// PDF rendering is browser-only (PDF.js worker won't load during SSR).
// Dynamic-import skips it from the server render pass entirely.
const PdfPreview = dynamic(
  () => import("./pdfPreview").then((m) => m.PdfPreview),
  { ssr: false, loading: PdfPreviewFallback },
);

function PdfPreviewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <FileTextIcon className="h-12 w-12 text-neutral-300" strokeWidth={1.2} />
    </div>
  );
}

// Numeric widths matching sizeMap, for passing to <Page width=...>.
const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 180,
  md: 220,
  lg: 260,
};

// 3D book cover. Tailwind v4 arbitrary values do the heavy lifting; two
// complex multi-stop gradients live as utility classes in globals.css
// (.book-cover-highlight, .book-spine-bg) because they don't compress into
// a sane arbitrary value.
//
// Sizes/colors are picked via static maps so Tailwind's scanner sees every
// class string at build time. Adding a new size or color means adding to
// the maps — Tailwind will then emit the utilities. Per AGENTS.md rule #3.

type Radius = "sm" | "md" | "lg";
type Size = "sm" | "md" | "lg";
export type BookCoverColor = keyof typeof colorMap;

const radiusMap: Record<Radius, string> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
};

const sizeMap: Record<Size, { width: string; spine: string }> = {
  sm: {
    width: "w-[180px]",
    // Spine slab is 48px wide, lives at left:0, rotated 90deg, then translated
    // to (width - 28px) so it sits flush against the cover's right edge.
    spine: "[transform:translateX(152px)_rotateY(90deg)]",
  },
  md: {
    width: "w-[220px]",
    spine: "[transform:translateX(192px)_rotateY(90deg)]",
  },
  lg: {
    width: "w-[260px]",
    spine: "[transform:translateX(232px)_rotateY(90deg)]",
  },
};

const colorMap = {
  slate: "from-slate-900 to-slate-700",
  gray: "from-gray-900 to-gray-700",
  zinc: "from-zinc-900 to-zinc-700",
  neutral: "from-neutral-900 to-neutral-700",
  stone: "from-stone-900 to-stone-700",
  red: "from-red-900 to-red-700",
  orange: "from-orange-900 to-orange-700",
  amber: "from-amber-900 to-amber-700",
  yellow: "from-yellow-900 to-yellow-700",
  lime: "from-lime-900 to-lime-700",
  green: "from-green-900 to-green-700",
  emerald: "from-emerald-900 to-emerald-700",
  teal: "from-teal-900 to-teal-700",
  cyan: "from-cyan-900 to-cyan-700",
  sky: "from-sky-900 to-sky-700",
  blue: "from-blue-900 to-blue-700",
  indigo: "from-indigo-900 to-indigo-700",
  violet: "from-violet-900 to-violet-700",
  purple: "from-purple-900 to-purple-700",
  fuchsia: "from-fuchsia-900 to-fuchsia-700",
  pink: "from-pink-900 to-pink-700",
  rose: "from-rose-900 to-rose-700",
} as const;

interface BookCoverProps {
  radius?: Radius;
  size?: Size;
  color?: BookCoverColor;
  isStatic?: boolean;
  className?: string;
  children: ReactNode;
}

export function BookCover({
  radius = "sm",
  size = "md",
  color = "zinc",
  isStatic = false,
  className = "",
  children,
}: BookCoverProps) {
  const gradient = colorMap[color];
  const { width, spine } = sizeMap[size];
  const r = radiusMap[radius];

  return (
    <div
      className={cn(
        "group z-10 w-min [perspective:800px] [--book-shadow:#bbb] dark:[--book-shadow:#111]",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-3/4 transition-transform duration-1000 [transform-style:preserve-3d]",
          width,
          r,
          isStatic
            ? "[transform:rotateY(-30deg)]"
            : "group-hover:[transform:rotateY(-30deg)]",
        )}
      >
        {/* Front cover */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 size-full overflow-hidden flex flex-col justify-end p-6 text-white bg-linear-to-tr",
            gradient,
            r,
            "[transform:translateZ(25px)] shadow-[5px_5px_20px_var(--book-shadow)]",
          )}
        >
          <div className="book-cover-highlight absolute left-0 top-0 h-full min-w-[8.2%] opacity-20" />
          <div className="relative pl-1">{children}</div>
        </div>

        {/* Spine (right-edge slab, seen edge-on after the rotateY) */}
        <div
          className={cn(
            "book-spine-bg absolute left-0 w-12 top-[3px] bottom-[3px]",
            spine,
          )}
        />

        {/* Back cover (offset behind via translateZ) */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 size-full overflow-hidden bg-linear-to-tr",
            gradient,
            r,
            "[transform:translateZ(-25px)] shadow-[-10px_0_50px_10px_var(--book-shadow)]",
          )}
        />
      </div>
    </div>
  );
}

export function BookHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex gap-2 flex-wrap", className)}>{children}</div>;
}

export function BookTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "mt-3 mb-1 select-none text-balance font-bold",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function BookDescription({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs/relaxed select-none opacity-80", className)}>
      {children}
    </p>
  );
}

// Shared 3D shell. Renders the perspective wrapper + the rotating inner +
// the spine slab. Front and back faces are full ReactNodes with their own
// [transform:translateZ(±25px)] so each variant fully owns its styling.
function Shell({
  size,
  radius,
  isStatic,
  className,
  front,
  back,
}: {
  size: Size;
  radius: Radius;
  isStatic: boolean;
  className?: string;
  front: ReactNode;
  back: ReactNode;
}) {
  const { width, spine } = sizeMap[size];
  const r = radiusMap[radius];

  return (
    <div
      className={cn(
        "group z-10 w-min [perspective:800px] [--book-shadow:#bbb] dark:[--book-shadow:#111]",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-3/4 transition-transform duration-1000 [transform-style:preserve-3d]",
          width,
          r,
          isStatic
            ? "[transform:rotateY(-30deg)]"
            : "group-hover:[transform:rotateY(-30deg)]",
        )}
      >
        {front}
        <div
          className={cn(
            "book-spine-bg absolute left-0 top-[3px] bottom-[3px] w-12",
            spine,
          )}
        />
        {back}
      </div>
    </div>
  );
}

// ---------- PdfCover (renders the first page of the PDF) ----------

interface PdfCoverProps {
  radius?: Radius;
  size?: Size;
  className?: string;
  /** URL of the PDF — usually ENDPOINTS.UPLOADS.FILE(uploadId). */
  src?: string;
  label?: string;
  title: string;
  meta?: string;
}

// Flat card, no 3D shell — stays still on hover (PDFs aren't books, they
// shouldn't pretend to flip). Top ~60% renders the first page of the PDF
// via react-pdf; bottom ~40% is a prominent meta block (label, large title,
// size·date). Shadow is half-strength (3/3/10) vs the tilted covers so the
// sheet reads as resting on the surface, not lifted off it.
export function PdfCover({
  size = "md",
  radius = "sm",
  className,
  src,
  label,
  title,
  meta,
}: PdfCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-3/4 flex flex-col overflow-hidden bg-white text-neutral-900 [--book-shadow:#bbb] dark:[--book-shadow:#111]",
        sizeMap[size].width,
        radiusMap[radius],
        "shadow-[3px_3px_10px_var(--book-shadow)]",
        className,
      )}
    >
      {/* Preview area — top 60% of the card */}
      <div className="relative h-[60%] overflow-hidden bg-neutral-50">
        {src ? (
          <PdfPreview
            src={src}
            width={SIZE_PX[size]}
            fallback={<PdfPreviewFallback />}
          />
        ) : (
          <PdfPreviewFallback />
        )}
        <div className="absolute right-3 top-3 rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm">
          PDF
        </div>
      </div>

      {/* Meta block — bottom 40% with prominent typography */}
      <div className="flex flex-1 flex-col gap-1 border-t bg-white px-5 py-4">
        {label && (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {label}
          </p>
        )}
        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-neutral-900">
          {title}
        </h3>
        {meta && (
          <p className="mt-auto text-xs text-neutral-400">{meta}</p>
        )}
      </div>
    </div>
  );
}

// ---------- MarkdownCover (cream paper, monospace .md badge) ----------

interface MarkdownCoverProps {
  radius?: Radius;
  size?: Size;
  isStatic?: boolean;
  className?: string;
  label?: string;
  title: string;
  meta?: string;
}

export function MarkdownCover({
  size = "md",
  radius = "sm",
  isStatic = false,
  className,
  label,
  title,
  meta,
}: MarkdownCoverProps) {
  const r = radiusMap[radius];
  return (
    <Shell
      size={size}
      radius={radius}
      isStatic={isStatic}
      className={className}
      front={
        <div
          className={cn(
            "absolute inset-y-0 left-0 size-full overflow-hidden flex flex-col bg-stone-50 text-neutral-900",
            r,
            "[transform:translateZ(25px)] shadow-[5px_5px_20px_var(--book-shadow)]",
          )}
        >
          {/* .md badge */}
          <div className="absolute right-3 top-3 rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
            .md
          </div>
          {/* Body */}
          <div className="flex flex-1 flex-col justify-end p-5">
            {label && (
              <p className="font-mono text-[10px] text-neutral-400">
                {label.toLowerCase()}
              </p>
            )}
            <h1 className="mt-1 line-clamp-3 select-none text-balance">
              <span className="font-mono text-neutral-400">{`# `}</span>
              <span className="font-serif text-lg font-semibold leading-tight">
                {title}
              </span>
            </h1>
            <div className="my-2 h-px bg-neutral-300" />
            {meta && (
              <p className="font-mono text-[10px] text-neutral-400">{meta}</p>
            )}
          </div>
        </div>
      }
      back={
        <div
          className={cn(
            "absolute inset-y-0 left-0 size-full overflow-hidden bg-stone-100",
            r,
            "[transform:translateZ(-25px)] shadow-[-10px_0_50px_10px_var(--book-shadow)]",
          )}
        />
      }
    />
  );
}
