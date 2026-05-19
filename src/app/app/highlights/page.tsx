"use client";

import { HighlighterIcon } from "lucide-react";
import PageEmptyState from "@/components/layouts/pageEmptyState";
import { t } from "@/lib/i18n";

export default function HighlightsPage() {
  const dict = t().app.stubs.highlights;
  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-neutral-900">{dict.title}</h1>
      <PageEmptyState
        icon={<HighlighterIcon />}
        title={dict.emptyTitle}
        description={dict.emptyDescription}
      />
    </div>
  );
}
