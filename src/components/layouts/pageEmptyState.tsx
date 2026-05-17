"use client";

export default function PageEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-24 border border-dashed rounded-lg mt-12">
      {icon && (
        <div className="text-muted-foreground/80 [&>svg]:size-16">{icon}</div>
      )}
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
