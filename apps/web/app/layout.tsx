import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
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
      <body className={`${inter.className} bg-wacke-dark text-white antialiased`}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

