import en from "../../locale/en.json";

export type Dictionary = typeof en;

const dictionaries = { en } as const;

export type Locale = keyof typeof dictionaries;

export function t(locale: Locale = "en"): Dictionary {
  return dictionaries[locale];
}

export function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}
