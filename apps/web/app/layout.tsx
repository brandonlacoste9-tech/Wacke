import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import LiveStatsTicker from "@/components/LiveStatsTicker";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

import MainLayoutWrapper from "@/components/MainLayoutWrapper";

import { cookies } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = cookieStore.get("wacke_lang")?.value === "fr" ? "fr" : "en";
  const isEn = lang === "en";

  const title = isEn ? "Wacké — Unfiltered Gen-Z Streaming | Powered by Wacké AI" : "Wacké — Le streaming sans filtre | Powered by Wacké AI";
  const description = isEn
    ? "Wacké is the ultimate streaming platform for Gen Z. AI Graffiti Chat, Roast Battles, and unfiltered chaos. Kick meets AI. Powered by Wacké AI."
    : "Wacké est la plateforme de streaming pour la Gen Z. Culture de rue, Graffiti Chat, Mode Chaos. Kick meets AI chaos. Powered by Wacké AI.";

  return {
    title: {
      default: title,
      template: "%s | Wacké × AI",
    },
    description,
    keywords: ["streaming", "québec", "twitch", "kick", "montréal", "francophone", "live", "gaming", "wacke", "ai"],
    icons: {
      icon: "/logo_w.png",
      shortcut: "/logo_w.png",
    },
    openGraph: {
      title,
      description,
      locale: isEn ? "en_US" : "fr_CA",
      type: "website",
      siteName: "Wacké × AI",
      images: [
        {
          url: "/hero_banner.jpg",
          width: 1200,
          height: 630,
          alt: "Wacké Streaming",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hero_banner.jpg"],
      creator: "@wacke_streaming",
    },
    metadataBase: new URL("https://wacke.ca"),
    verification: {
      google: "m3HsEEaCPt_PvBBw-a78DUm1_xW2clzyjszGoUy21_M",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const isEn = cookieStore.get("wacke_lang")?.value !== "fr";
  return (
    <html lang={isEn ? "en" : "fr-CA"} translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Wacké",
              "url": "https://wacke.ca",
              "logo": "https://wacke.ca/logo_w.png",
              "description": "Wacké is the ultimate streaming platform for Gen Z.",
              "sameAs": [
                "https://twitter.com/wacke_streaming"
              ]
            })
          }}
        />
      </head>
      <body
        className={`font-outfit bg-wacke-dark text-white antialiased`}
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
            <div className="hidden md:block fixed bottom-1 right-2 text-[9px] font-mono text-wacke-cyan/40 z-[999] pointer-events-none">POWERED BY WACKÉ AI</div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-[3px] text-orange-500/70 z-[999] pointer-events-none hidden ai-fuego:block">🔥 AI ON FUEGO 🔥</div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
