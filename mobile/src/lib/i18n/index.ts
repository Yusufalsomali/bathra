import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { en } from "./en";
import { ar } from "./ar";

const i18n = new I18n({ en, ar });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? "en";
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export default i18n;

export type TranslationKey = keyof typeof en;

export function setLocale(locale: "en" | "ar") {
  i18n.locale = locale;
}

export function getLocale(): "en" | "ar" {
  return (i18n.locale as "en" | "ar") ?? "en";
}

export function isRTL(): boolean {
  return i18n.locale === "ar";
}
