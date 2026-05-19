"use client";

import { UserIcon } from "lucide-react";
import PageEmptyState from "@/components/layouts/pageEmptyState";
import { useAuth } from "@/components/layouts/authProvider";
import { t, format } from "@/lib/i18n";

export default function AccountPage() {
  const dict = t().app.stubs.account;
  const user = useAuth();

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-neutral-900">{dict.title}</h1>
      <PageEmptyState
        icon={<UserIcon />}
        title={user.email}
        description={format(dict.emptyDescription, { email: user.email })}
      />
    </div>
  );
}
