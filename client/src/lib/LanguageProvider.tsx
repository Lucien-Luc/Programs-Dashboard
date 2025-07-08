import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useTranslation, type Language, type TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isAdminRoute: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [location] = useLocation();
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language, then default to English
    const saved = localStorage.getItem("app-language") as Language;
    if (saved && ["en", "es", "fr", "rw", "de"].includes(saved)) {
      return saved;
    }
    
    // Try to detect browser language
    const browserLang = navigator.language.split("-")[0] as Language;
    if (["en", "es", "fr", "rw", "de"].includes(browserLang)) {
      return browserLang;
    }
    
    return "en";
  });

  const { t } = useTranslation(language);
  
  // Determine if we're on an admin route
  const isAdminRoute = location.startsWith("/admin");

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t: isAdminRoute ? ((key: TranslationKey) => key as string) : t, // Don't translate admin routes
    isAdminRoute,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}