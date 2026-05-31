import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { resolveSupportedLanguage } from "./languages";

export { SUPPORTED_LANGUAGES, resolveSupportedLanguage } from "./languages";

const RESOURCE_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "pt-BR",
  "ru",
  "zh-CN",
] as const;

const RESOURCE_CODES = new Map(
  RESOURCE_LANGUAGE_CODES.map((code) => [code.toLowerCase(), code]),
);

const SIMPLIFIED_CHINESE_RESOURCE_LOCALES = new Set(["zh", "zh-cn", "zh-sg", "zh-my"]);

type TranslationResource = Record<string, unknown>;

const localeModules = import.meta.glob<{ default: TranslationResource }>(
  "./locales/*.json",
);

const SUPPORTED_LANGUAGE_CODES = RESOURCE_LANGUAGE_CODES.map((code) => code);

function localeModulePath(language: string): string {
  return `./locales/${language}.json`;
}

function localeBackendLoader(language: string): Promise<TranslationResource> {
  const resolvedLanguage = resolveResourceLanguage(language);
  const loader = localeModules[localeModulePath(resolvedLanguage)];

  if (!loader) {
    return Promise.reject(
      new Error(`Unsupported locale module: ${resolvedLanguage}`),
    );
  }

  return loader().then((module) => module.default);
}

function resolveResourceLanguage(locale: string): string {
  const normalized = locale.trim().replace(/_/g, "-").toLowerCase();
  const exactMatch = RESOURCE_CODES.get(normalized);
  if (exactMatch) return exactMatch;

  if (
    SIMPLIFIED_CHINESE_RESOURCE_LOCALES.has(normalized) ||
    normalized.startsWith("zh-hans")
  ) {
    return "zh-CN";
  }

  const base = normalized.split("-")[0];
  return RESOURCE_CODES.get(base) ?? resolveSupportedLanguage(locale);
}

/**
 * Detect the best initial language from the runtime locale.
 *
 * Browser environments: uses `navigator.language` (for example: "es-419", "en-US").
 * Non-browser environments (SSR/tests/Node): falls back to `"en"` when `navigator`
 * is unavailable or does not expose a valid language string.
 *
 * Any provided locale is normalized and mapped by `resolveSupportedLanguage`,
 * which handles region/script variants and unsupported values.
 */
function detectInitialLanguage(): string {
  const navLanguage =
    typeof navigator !== "undefined" && typeof navigator.language === "string"
      ? navigator.language
      : "en";
  return resolveSupportedLanguage(navLanguage);
}

export async function changeAppLanguage(locale: string): Promise<string> {
  const resolvedLanguage = resolveSupportedLanguage(locale);
  await i18n.changeLanguage(resolvedLanguage);
  return resolvedLanguage;
}

export const i18nReady = i18n
  .use(resourcesToBackend(localeBackendLoader))
  .use(initReactI18next)
  .init({
    resources: {},
    partialBundledLanguages: true,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    lng: detectInitialLanguage(),
    fallbackLng: "en",
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
