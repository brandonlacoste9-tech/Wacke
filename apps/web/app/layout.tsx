import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import LiveStatsTicker from "@/components/LiveStatsTicker";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Wacké — Le streaming québécois",
    template: "%s | Wacké",
  },
  description:
    "Wacké est la plateforme de streaming française pour la Gen Z québécoise. Culture de rue, Graffiti Chat, Mode Sacré. Kick meets dépanneur drama.",
  keywords: ["streaming", "québec", "twitch", "kick", "montréal", "francophone", "live"],
  openGraph: {
    title: "Wacké — Le streaming québécois",
    description: "Streaming live. Culture de rue. 100% québécois.",
    locale: "fr_CA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-CA">
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
          <LiveStatsTicker />
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-[calc(100vh-64px)] overflow-x-hidden pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}


