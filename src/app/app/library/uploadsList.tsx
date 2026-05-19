"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import For from "@/components/logics/forData";
import { UploadCard } from "./uploadCard";
import { isListSuccess, listUploads } from "@/network/uploads";
import { t } from "@/lib/i18n";
import type { PublicUpload } from "@/@types/database/uploads";

interface UploadsListProps {
  items: PublicUpload[];
  nextCursor: string | null;
  onAppend: (more: PublicUpload[], cursor: string | null) => void;
}

// Controlled pager — the parent library page owns items + nextCursor so
// UploadDialog can prepend new rows without a refetch. This component is
// only in charge of the "load more" call.
export function UploadsList({ items, nextCursor, onAppend }: UploadsListProps) {
  const dict = t().app.library;
  const [pending, setPending] = useState(false);

  async function loadMore() {
    if (!nextCursor || pending) return;
    setPending(true);
    try {
      const res = await listUploads({ cursor: nextCursor });
      if (!isListSuccess(res)) {
        toast.error(dict.loadError);
        return;
      }
      onAppend(res.uploads, res.nextCursor);
    } catch {
      toast.error(dict.loadError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex mt-6 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <For
          data={items}
          render={(upload: PublicUpload) => (
            <Link href={`/app/library/${upload.id}`} className="block">
              <UploadCard upload={upload} />
            </Link>
          )}
        />
      </div>

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={pending}
          >
            {pending ? dict.loadingMore : dict.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
