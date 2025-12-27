import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WACKÉ - Live Streaming Chaos",
  description: "Wacké is a French-first, slang-soaked live streaming platform built for Gen Z chaos. Inspired by Montréal street culture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-wacke-dark">
        {children}
      </body>
    </html>
  );
}
