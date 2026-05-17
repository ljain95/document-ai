"use client";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="bg-neutral-50 h-screen overflow-y-auto p-12">{children}</div>
}
