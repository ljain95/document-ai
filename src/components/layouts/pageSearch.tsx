"use client";

import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PageSearch({
  onChange,
  className,
  placeholder = 'Search',
  value = '',
}: {
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  value?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        value={value}
        className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm"
      />
    </div>
  )
}
