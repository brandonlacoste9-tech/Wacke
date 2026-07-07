import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import LiveStatsTicker from "@/components/LiveStatsTicker";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

import MainLayoutWrapper from "@/components/MainLayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = cookieStore.get("wacke_lang")?.value === "en" ? "en" : "fr";
  const isEn = lang === "en";

  const title = isEn ? "Wacké — Unfiltered Gen-Z Streaming | Powered by Grok xAI" : "Wacké — Le streaming québécois | Powered by Grok xAI";
  const description = isEn
    ? "Wacké is the ultimate streaming platform for Gen Z. AI Graffiti Chat, Roast Battles, and unfiltered chaos. Kick meets AI. Powered by Grok xAI."
    : "Wacké est la plateforme de streaming française pour la Gen Z québécoise. Culture de rue, Graffiti Chat, Mode Sacré. Kick meets dépanneur drama. Powered by Grok xAI.";

  return {
    title: {
      default: title,
      template: "%s | Wacké × Grok xAI",
    },
    description,
    keywords: ["streaming", "québec", "twitch", "kick", "montréal", "francophone", "live", "gaming", "wacke", "grok", "xai"],
    icons: {
      icon: "/logo_w.png",
      shortcut: "/logo_w.png",
    },
    openGraph: {
      title,
      description,
      locale: isEn ? "en_US" : "fr_CA",
      type: "website",
      siteName: "Wacké × Grok xAI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    metadataBase: new URL("https://wacke.ca"),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-CA" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`${inter.className} bg-wacke-dark text-white antialiased`}
        style={{
          backgroundImage: `url('/bg_texture.jpg')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
          backgroundBlendMode: 'soft-light'
        }}
      >
        <AuthProvider>
          <LanguageProvider>
            <MainLayoutWrapper>
              {children}
            </MainLayoutWrapper>
            <div className="fixed bottom-1 right-2 text-[9px] font-mono text-wacke-cyan/40 z-[999] pointer-events-none">POWERED BY GROK xAI</div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-[3px] text-orange-500/70 z-[999] pointer-events-none hidden grok-fuego:block">🔥 GROKS ON FUEGO 🔥</div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
