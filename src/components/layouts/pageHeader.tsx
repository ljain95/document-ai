"use client";

export default function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex w-full  items-start justify-between relative">
      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <h1 className="mt-1 text-sm text-neutral-500">{description}</h1>
      </div>
      {children}
    </div>
  )
}
