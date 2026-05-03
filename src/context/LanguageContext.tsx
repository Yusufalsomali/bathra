import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  Language,
  homeTranslations,
  signupTranslations,
  startupTranslations,
  investorTranslations,
} from "@/utils/language";
import { UserProfile } from "@/lib/auth-types";

// Combine all translations into one object
const translations = {
  ...homeTranslations,
  ...signupTranslations,
  ...startupTranslations,
  ...investorTranslations,
};

export type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  canChangeLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

// Helper function to get initial language
const getInitialLanguage = (): Language => {
  try {
    // First, check localStorage for saved preference
    const savedLanguage = localStorage.getItem(
      "preferred-language"
    ) as Language;
    if (savedLanguage && ["English", "Arabic"].includes(savedLanguage)) {
      return savedLanguage;
    }

    // Fallback to browser language detection
    const browserLanguage = navigator.language || navigator.languages?.[0];
    if (browserLanguage?.startsWith("ar")) {
      return "Arabic";
    }
  } catch (error) {
    // localStorage might not be available (SSR, privacy mode, etc.)
    console.warn("Could not access localStorage for language preference");
  }

  // Default fallback
  return "English";
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Listen for auth context changes to enforce admin language rules
  useEffect(() => {
    const dir = language === "Arabic" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language === "Arabic" ? "ar" : "en";
    document.body.dir = dir;
    document.body.classList.toggle("font-arabic", language === "Arabic");
  }, [language]);

  useEffect(() => {
    // We'll listen for auth changes through a custom event to avoid circular imports
    const handleAuthChange = (event: CustomEvent) => {
      const { profile } = event.detail;
      setUserProfile(profile);

      // Force English for admin users
      if (profile?.accountType === "admin") {
        setLanguageState("English");
        try {
          localStorage.setItem("preferred-language", "English");
        } catch (error) {
          console.warn("Could not save language preference to localStorage");
        }
      }
    };

    window.addEventListener(
      "authProfileChange",
      handleAuthChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "authProfileChange",
        handleAuthChange as EventListener
      );
    };
  }, []);

  // Check if user can change language (non-admin users only)
  const canChangeLanguage = userProfile?.accountType !== "admin";

  // Enhanced setLanguage that respects admin restrictions
  const setLanguage = (newLanguage: Language) => {
    // Prevent language change for admin users
    if (userProfile?.accountType === "admin") {
      console.warn("Language change is not allowed for admin users");
      return;
    }

    try {
      localStorage.setItem("preferred-language", newLanguage);
    } catch (error) {
      console.warn("Could not save language preference to localStorage");
    }
    setLanguageState(newLanguage);
  };

  const t = (key: TranslationKey): string => {
    return (
      (translations[key] as Record<Language, string>)?.[language] ||
      (translations[key] as Record<Language, string>)?.English ||
      key
    );
  };

  const isRTL = language === "Arabic";

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    canChangeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-arabic" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
