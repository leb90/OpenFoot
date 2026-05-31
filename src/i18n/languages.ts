export const SUPPORTED_LANGUAGES = [
  { code: "en", labelKey: "settings.languages.en" },
  { code: "es", labelKey: "settings.languages.es" },
  { code: "fr", labelKey: "settings.languages.fr" },
  { code: "de", labelKey: "settings.languages.de" },
  { code: "it", labelKey: "settings.languages.it" },
] as const;

const SUPPORTED_CODES = new Map(
  SUPPORTED_LANGUAGES.map((language) => [
    language.code.toLowerCase(),
    language.code,
  ]),
);

export function resolveSupportedLanguage(locale: string): string {
  const normalized = locale.trim().replace(/_/g, "-").toLowerCase();
  const exactMatch = SUPPORTED_CODES.get(normalized);
  if (exactMatch) return exactMatch;

  const base = normalized.split("-")[0];
  return SUPPORTED_CODES.get(base) ?? "en";
}
