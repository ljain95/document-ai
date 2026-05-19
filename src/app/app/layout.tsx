"use client";

import { AuthProvider, useAuth } from "@/components/layouts/authProvider";
import { MiniSidebar } from "@/components/layouts/miniSidebar";

function Shell({ children }: { children: React.ReactNode }) {
  const user = useAuth();
  return (
    <div className="flex min-h-svh">
      <MiniSidebar email={user.email} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
