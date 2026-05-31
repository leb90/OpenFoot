import { afterAll, describe, expect, it } from "vitest";
import i18n, { changeAppLanguage, i18nReady, resolveSupportedLanguage } from "./index";

describe("resolveSupportedLanguage", () => {
  it("keeps exact and base language matching for selectable locales", () => {
    expect(resolveSupportedLanguage("es-419")).toBe("es");
    expect(resolveSupportedLanguage("en-US")).toBe("en");
    expect(resolveSupportedLanguage("fr-CA")).toBe("fr");
    expect(resolveSupportedLanguage("de-AT")).toBe("de");
    expect(resolveSupportedLanguage("it-CH")).toBe("it");
  });

  it("falls back to English for unsupported locales", () => {
    expect(resolveSupportedLanguage("nl-NL")).toBe("en");
    expect(resolveSupportedLanguage("pt-BR")).toBe("en");
    expect(resolveSupportedLanguage("ru-RU")).toBe("en");
    expect(resolveSupportedLanguage("zh-CN")).toBe("en");
    expect(resolveSupportedLanguage("zh-Hant-TW")).toBe("en");
  });
});

describe("i18n lazy loading", () => {
  afterAll(async () => {
    await changeAppLanguage("en");
  });

  it("initializes with the active language resources instead of all locales", async () => {
    await i18nReady;

    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("es", "translation")).toBe(false);
    expect(i18n.hasResourceBundle("fr", "translation")).toBe(false);
  });

  it("loads a locale bundle on demand when the app language changes", async () => {
    await i18nReady;

    await changeAppLanguage("fr-CA");

    expect(i18n.language).toBe("fr");
    expect(i18n.hasResourceBundle("fr", "translation")).toBe(true);
  });
});
