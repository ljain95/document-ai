"use client";

import {
  BookIcon,
  BookMarkedIcon,
  FileBarChartIcon,
  FileIcon,
  NewspaperIcon,
  PresentationIcon,
  type LucideIcon,
} from "lucide-react";
import {
  BookCover,
  BookTitle,
  BookDescription,
  MarkdownCover,
  PdfCover,
  type BookCoverColor,
} from "@/components/ui/cover3D";
import { ENDPOINTS } from "@/constants/endpoints";
import { formatBytes, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { DocType } from "@/constants/uploads";
import type { PublicUpload } from "@/@types/database/uploads";

// Stable color picker — same novel always gets the same cover regardless of
// which session / machine renders it. Listed as full keys of BookCover's
// colorMap so Tailwind's scanner picks them up at build time.
const BOOK_COLORS: BookCoverColor[] = [
  "emerald",
  "sky",
  "amber",
  "violet",
  "indigo",
  "teal",
  "orange",
  "blue",
  "fuchsia",
];

function colorFor(id: string): BookCoverColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return BOOK_COLORS[Math.abs(h) % BOOK_COLORS.length];
}

function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

const ICON_BY_TYPE: Record<DocType, LucideIcon> = {
  NOVEL: BookIcon,
  RESEARCH_PAPER: BookMarkedIcon,
  PRESENTATION: PresentationIcon,
  TEXTBOOK: BookIcon,
  ARTICLE: NewspaperIcon,
  REPORT: FileBarChartIcon,
  OTHER: FileIcon,
};

// Cover selection:
//   doc type NOVEL    → BookCover (regardless of file format — intent wins)
//   else .pdf file    → PdfCover
//   else .md  file    → MarkdownCover
//   else (e.g. .docx) → flat DocumentCard
export function UploadCard({ upload }: { upload: PublicUpload }) {
  if (upload.type === "NOVEL") return <BookCard upload={upload} />;
  const ext = extOf(upload.filename);
  if (ext === ".pdf") return <PdfCard upload={upload} />;
  if (ext === ".md") return <MarkdownCard upload={upload} />;
  return <DocumentCard upload={upload} />;
}

function BookCard({ upload }: { upload: PublicUpload }) {
  const dict = t().app.library;
  const color = colorFor(upload.id);

  return (
    <div className="flex justify-center">
      <BookCover size="md" color={color} radius="sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">
          {dict.types[upload.type]}
        </p>
        <BookTitle className="font-serif text-lg leading-tight">
          {upload.name}
        </BookTitle>
        <BookDescription>
          {formatBytes(upload.sizeBytes)} · {formatDate(upload.createdAt)}
        </BookDescription>
      </BookCover>
    </div>
  );
}

function PdfCard({ upload }: { upload: PublicUpload }) {
  const dict = t().app.library;
  return (
    <div className="flex justify-center">
      <PdfCover
        size="md"
        radius="sm"
        src={ENDPOINTS.UPLOADS.FILE(upload.id)}
        label={dict.types[upload.type]}
        title={upload.name}
        meta={`${formatBytes(upload.sizeBytes)} · ${formatDate(upload.createdAt)}`}
      />
    </div>
  );
}

function MarkdownCard({ upload }: { upload: PublicUpload }) {
  const dict = t().app.library;
  return (
    <div className="flex justify-center">
      <MarkdownCover
        size="md"
        radius="sm"
        label={dict.types[upload.type]}
        title={upload.name}
        meta={`${formatBytes(upload.sizeBytes)} · ${formatDate(upload.createdAt)}`}
      />
    </div>
  );
}

function DocumentCard({ upload }: { upload: PublicUpload }) {
  const dict = t().app.library;
  const Icon = ICON_BY_TYPE[upload.type];

  return (
    <div className="flex flex-col overflow-hidden rounded-md border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <Icon className="h-12 w-12 text-neutral-400" strokeWidth={1.4} />
      </div>
      <div className="flex h-24 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-neutral-900">
          {upload.name}
        </p>
        <p className="text-xs text-neutral-500">{dict.types[upload.type]}</p>
        <p className="mt-auto text-[10px] text-neutral-400">
          {formatBytes(upload.sizeBytes)} · {formatDate(upload.createdAt)}
        </p>
      </div>
    </div>
  );
}
