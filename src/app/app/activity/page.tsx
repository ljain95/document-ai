"use client";

import { HistoryIcon } from "lucide-react";
import PageEmptyState from "@/components/layouts/pageEmptyState";
import { t } from "@/lib/i18n";

export default function ActivityPage() {
  const dict = t().app.stubs.activity;
  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-neutral-900">{dict.title}</h1>
      <PageEmptyState
        icon={<HistoryIcon />}
        title={dict.emptyTitle}
        description={dict.emptyDescription}
      />
    </div>
  );
}
