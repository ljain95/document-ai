"use client";

export default function PageDescription({ description }: { description: string }) {
  return <p className="text-sm text-muted-foreground">{description}</p>
}
