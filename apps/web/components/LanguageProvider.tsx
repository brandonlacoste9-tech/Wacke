"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSavedLang(): Language | null {
  try {
    // Check cookie first, then localStorage
    const cookieMatch = document.cookie.match(/(?:^|;\s*)wacke_lang=([^;]*)/);
    const fromCookie = cookieMatch?.[1] as Language | undefined;
    if (fromCookie === "fr" || fromCookie === "en") return fromCookie;

    const fromStorage = localStorage.getItem("wacke_lang") as Language | null;
    if (fromStorage === "fr" || fromStorage === "en") return fromStorage;
  } catch {
    // localStorage blocked (private browsing etc.)
  }
  return null;
}

function persistLang(lang: Language) {
  try {
    localStorage.setItem("wacke_lang", lang);
  } catch { /* ignore */ }

  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `wacke_lang=${lang}; path=/; expires=${expires}; SameSite=Lax${secure}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  /**
   * Always initialize to "fr".
   *
   * This is critical for Next.js SSR/hydration correctness:
   *  - Server renders with "fr" (window is undefined → we can't read localStorage)
   *  - Client hydrates with the same "fr" initial value → no mismatch
   *  - After hydration, the useEffect below reads the real saved preference
   *
   * Previous bug: we used a lazy initializer that read localStorage during
   * hydration. This caused a server/client mismatch, and React's reconciliation
   * would flash "fr" → "en" → then the click would show "fr" for one frame
   * before the hydration correction snapped it back to "en".
   */
  const [language, setLanguageState] = useState<Language>("fr");

  // Read saved preference exactly once, after the component mounts on the client.
  useEffect(() => {
    const saved = readSavedLang();
    if (saved && saved !== "fr") {
      setLanguageState(saved);
    }
  }, []); // empty deps → runs once on mount, never again

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    persistLang(lang);
  };

  const t = (key: TranslationKey): string =>
    translations[language][key] ?? translations["fr"][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
