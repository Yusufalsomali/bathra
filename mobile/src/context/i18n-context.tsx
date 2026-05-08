import React, { createContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { setLocale, getLocale } from "@/lib/i18n";
import * as Localization from "expo-localization";

interface I18nContextValue {
  locale: "en" | "ar";
  t: (scope: string, options?: Record<string, unknown>) => string;
  changeLocale: (locale: "en" | "ar") => Promise<void>;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (scope) => scope,
  changeLocale: async () => {},
});

const LOCALE_STORAGE_KEY = "bathra_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<"en" | "ar">(getLocale());

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "ar") {
        setLocale(stored);
        setLocaleState(stored);
      } else {
        const deviceLocale = Localization.getLocales()[0]?.languageCode;
        const detected = deviceLocale === "ar" ? "ar" : "en";
        setLocale(detected);
        setLocaleState(detected);
      }
    });
  }, []);

  const changeLocale = useCallback(async (newLocale: "en" | "ar") => {
    setLocale(newLocale);
    setLocaleState(newLocale);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (scope: string, options?: Record<string, unknown>) => {
      return i18n.t(scope, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
