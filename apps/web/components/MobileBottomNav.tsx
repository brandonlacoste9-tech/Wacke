"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Radio, Coins, User } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";

/**
 * MobileBottomNav — Floating bottom navigation for small screens.
 * Visible only on mobile (md:hidden).
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, claimDailyTokens } = useAuth();
  const { t } = useLanguage();
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const handleClaim = async () => {
    const res = await claimDailyTokens();
    setClaimFeedback(res.success ? "+500 🪙" : t("alreadyClaimed"));
    setTimeout(() => setClaimFeedback(null), 2000);
  };

  const items = [
    { href: "/",               icon: <Home className="w-5 h-5" />,   label: t("home") },
    { href: "/browse",         icon: <Search className="w-5 h-5" />, label: t("explore") },
    { href: "/dashboard/studio", icon: <Radio className="w-5 h-5" />,  label: t("stream") },
    { href: user ? `/profile/${user.username}` : "/auth/login", icon: <User className="w-5 h-5" />, label: t("profile") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-wacke-purple/20 md:hidden">
      {/* Claim feedback toast */}
      {claimFeedback && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass-dark rounded-xl px-4 py-2 text-xs font-bold animate-slide-up neon-border">
          {claimFeedback}
        </div>
      )}

      <div className="flex items-center justify-around py-2 px-4">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-xl transition-all active:scale-90
                         ${active ? "text-wacke-pink" : "text-gray-500 hover:text-gray-300"}`}
            >
              <span className="relative">
                {item.icon}
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-wacke-pink shadow-[0_0_6px_rgba(255,20,147,0.6)]" />
                )}
              </span>
              <span className="text-[9px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* Token Claim Button */}
        <button
          onClick={handleClaim}
          className="flex flex-col items-center space-y-0.5 py-1 px-3 rounded-xl text-yellow-400 hover:text-yellow-300 transition-all active:scale-90"
        >
          <span className="relative">
            <Coins className="w-5 h-5" />
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-wacke-red rounded-full text-[7px] text-white font-bold flex items-center justify-center animate-pulse">
              !
            </span>
          </span>
          <span className="text-[9px] font-bold">{t("tokensNav")}</span>
        </button>
      </div>
    </nav>
  );
}
