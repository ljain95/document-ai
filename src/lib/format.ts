// Human-readable formatters shared between server-rendered HTML and client
// components. No locale-aware overrides yet — defaults to en-US numeric forms.

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(unixMs: number): string {
  return dateFmt.format(new Date(unixMs));
}
