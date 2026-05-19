"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpenIcon } from "lucide-react";
import { UploadDialog } from "./uploadDialog";
import { UploadsList } from "./uploadsList";
import PageEmptyState from "@/components/layouts/pageEmptyState";
import PageLoader from "@/components/layouts/pageLoader";
import { isListSuccess, listUploads } from "@/network/uploads";
import { t } from "@/lib/i18n";
import type { PublicUpload } from "@/@types/database/uploads";

// All data is fetched client-side via the network layer (AGENTS.md §7+§8).
// State (items + nextCursor) lives here so UploadDialog can prepend new rows
// without a roundtrip and UploadsList stays a controlled pager.
export default function LibraryPage() {
  const dict = t().app.library;
  const [items, setItems] = useState<PublicUpload[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listUploads()
      .then((res) => {
        if (!active) return;
        if (isListSuccess(res)) {
          setItems(res.uploads);
          setNextCursor(res.nextCursor);
        } else {
          // 401 is already redirected by core/api.ts; this branch is the
          // defensive fallback for any other typed failure.
          toast.error(dict.loadError);
          setItems([]);
        }
      })
      .catch(() => {
        if (!active) return;
        toast.error(dict.loadError);
        setItems([]);
      });
    return () => {
      active = false;
    };
  }, [dict.loadError]);

  function onUploaded(upload: PublicUpload) {
    setItems((prev) => (prev ? [upload, ...prev] : [upload]));
  }

  function onAppend(more: PublicUpload[], cursor: string | null) {
    setItems((prev) => [...(prev ?? []), ...more]);
    setNextCursor(cursor);
  }

  if (items === null) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <PageLoader size={8} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-neutral-900">{dict.title}</h1>
          <p className="text-sm text-neutral-500">{dict.description}</p>
        </div>
        <UploadDialog onUploaded={onUploaded} />
      </div>

      {items.length === 0 ? (
        <PageEmptyState
          icon={<BookOpenIcon />}
          title={dict.emptyTitle}
          description={dict.emptyDescription}
          action={<UploadDialog onUploaded={onUploaded} />}
        />
      ) : (
        <UploadsList
          items={items}
          nextCursor={nextCursor}
          onAppend={onAppend}
        />
      )}
    </div>
  );
}
