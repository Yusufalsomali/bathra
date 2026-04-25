import { useContext } from "react";
import { I18nContext } from "@/context/i18n-context";

export function useRTL() {
  const { locale } = useContext(I18nContext);
  const isRTL = locale === "ar";
  return {
    isRTL,
    direction: isRTL ? ("rtl" as const) : ("ltr" as const),
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    flexDirection: isRTL ? ("row-reverse" as const) : ("row" as const),
  };
}
