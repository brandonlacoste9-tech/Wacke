"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to read cookies on client (consistent with AuthProvider)
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "fr";
    const cookieLang = getCookie("wacke_lang") as Language;
    const saved = cookieLang || localStorage.getItem("wacke_lang") as Language;
    return (saved === "fr" || saved === "en") ? saved : "fr";
  });



  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("wacke_lang", lang);
    if (typeof document !== "undefined") {
      const date = new Date();
      date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      const secureFlag = window.location.protocol === 'https:' ? "; Secure" : "";
      document.cookie = `wacke_lang=${lang}; path=/; expires=${date.toUTCString()}; SameSite=Lax${secureFlag}`;
    }
    // Reload shortly after to ensure the new cookie is sent with the next request.
    // This makes server-rendered language strings (from cookie in pages like stream view) update reliably on prod/Netlify.
    // Client-side UI (t() calls) switch instantly.
    setTimeout(() => window.location.reload(), 50);
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
