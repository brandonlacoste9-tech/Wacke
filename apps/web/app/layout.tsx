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

export const metadata: Metadata = {
  title: {
    default: "Wacké — Le streaming québécois | Powered by Grok xAI",
    template: "%s | Wacké × Grok xAI",
  },
  description:
    "Wacké est la plateforme de streaming française pour la Gen Z québécoise. Culture de rue, Graffiti Chat, Mode Sacré. Kick meets dépanneur drama. Powered by Grok xAI.",
  keywords: ["streaming", "québec", "twitch", "kick", "montréal", "francophone", "live", "gaming", "wacke", "grok", "xai"],
  icons: {
    icon: "/logo_w.png",
    shortcut: "/logo_w.png",
  },
  openGraph: {
    title: "Wacké — Le streaming québécois | Powered by Grok xAI",
    description: "Streaming live. Culture de rue. 100% québécois. Powered by Grok xAI.",
    locale: "fr_CA",
    type: "website",
    siteName: "Wacké × Grok xAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wacké — Le streaming québécois | Powered by Grok xAI",
    description: "Streaming live. Culture de rue. 100% québécois. Powered by Grok xAI.",
  },
  metadataBase: new URL("https://wacke.ca"),
};

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
