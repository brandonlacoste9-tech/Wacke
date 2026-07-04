"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { translations, type Language, type TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("wacke-lang") as Language;
    if (saved && (saved === "fr" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wacke-lang", lang);
    if (typeof document !== "undefined") {
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `wacke_lang=${lang}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    }
    router.refresh();
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations["fr"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
