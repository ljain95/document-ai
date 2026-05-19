"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import PageLoader from "@/components/layouts/pageLoader";
import { getUpload, isGetUploadSuccess } from "@/network/uploads";
import { formatBytes, formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { PdfReader } from "./pdfReader";
import type { PublicUpload } from "@/@types/database/uploads";

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const dict = t().app.library;
  const typeDict = dict.types;

  const [upload, setUpload] = useState<PublicUpload | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getUpload(id)
      .then((res) => {
        if (!active) return;
        if (isGetUploadSuccess(res)) {
          setUpload(res.upload);
        } else if (res.error === "not_found") {
          setMissing(true);
        }
        // `unauthorized` is handled by the global 401 redirect in core/api.ts.
      })
      .catch(() => {
        if (active) setMissing(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (missing) {
    // Defers to the nearest not-found boundary (Next's default 404 page if
    // none is defined), matching the server-component behaviour before this
    // page was made client-side.
    notFound();
  }

  if (!upload) {
    return (
      <div className="flex h-svh items-center justify-center">
        <PageLoader size={8} />
      </div>
    );
  }

  const dot = upload.filename.lastIndexOf(".");
  const ext = dot >= 0 ? upload.filename.slice(dot).toLowerCase() : "";

  return (
    <div className="flex h-svh flex-col fixed top-0 left-0 right-0 bottom-0 bg-neutral-50">
      {/* Reader header — back link + title/meta */}
      <header className="flex items-center justify-between gap-4 border-b bg-neutral-50 px-6 py-3">
        <Link
          href="/app/library"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {dict.back}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {typeDict[upload.type]}
          </p>
          <p className="truncate text-sm font-medium text-neutral-900">
            {upload.name}
          </p>
        </div>
        <p className="hidden text-[10px] text-neutral-400 sm:block">
          {formatBytes(upload.sizeBytes)} · {formatDate(upload.createdAt)}
        </p>
      </header>

      {/* Document surface — toolbar stacks above the scroll area on mobile
          and sits as a sibling column on md+. */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {ext === ".pdf" ? (
          <PdfReader id={upload.id} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-neutral-50 p-12 text-sm text-neutral-500">
            {dict.unsupportedFormat}
          </div>
        )}
      </div>
    </div>
  );
}
