"use client";

import Link from "next/link";
import { Bot, Flame, Shield, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { ReservedUsername } from "@wacke/db";
import ParticleBackground from "./ParticleBackground";

interface ClaimPageProps {
  username: string;
  reserved: ReservedUsername | null;
  hoursRemaining: number;
  isClaimed: boolean;
}

export default function ClaimPage({ username, reserved, hoursRemaining, isClaimed }: ClaimPageProps) {
  const { t, language } = useLanguage();
  const displayName = reserved?.displayName ?? username.charAt(0).toUpperCase() + username.slice(1);
  const isHeld = reserved?.status === "held";

  const signupHref = `/auth/signup?username=${encodeURIComponent(username)}&claim=1`;

  return (
    <main className="min-h-screen bg-wacke-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-wacke-purple/10 via-transparent to-wacke-dark z-0" />
      <ParticleBackground count={18} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Handle badge */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 glass rounded-full px-5 py-2 mb-6 border border-wacke-pink/30">
            <Sparkles className="w-4 h-4 text-wacke-pink" />
            <span className="text-xs font-bold uppercase tracking-[3px] text-wacke-cyan">
              {isClaimed ? t("claimPageClaimed") : t("claimPageReserved")}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-display tracking-tight mb-3">
            <span className="gradient-text-cyber">@{username}</span>
          </h1>
          <p className="text-xl text-gray-300 font-medium">
            {displayName} — {t("claimPageSubtitle")}
          </p>
        </div>

        {/* Preview card */}
        <div className="glass-card rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-wacke-pink/10 mb-8">
          <div className="relative aspect-video bg-gradient-to-br from-wacke-purple/30 via-wacke-dark to-wacke-cyan/20 flex items-center justify-center">
            <img src="/hero_banner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="relative text-center px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-3xl font-black mx-auto mb-4 ring-4 ring-white/10 shadow-xl">
                {displayName[0]}
              </div>
              <p className="text-lg font-bold text-white">{displayName}</p>
              <p className="text-sm text-wacke-cyan mt-1">{t("claimPagePreviewTag")}</p>
            </div>
            <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>PREVIEW</span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-5">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">{t("claimPageWhatYouGet")}</h2>

            <div className="grid gap-4">
              {[
                { icon: <Bot className="w-5 h-5" />, title: t("claimPageGrokTitle"), desc: t("claimPageGrokDesc") },
                { icon: <Flame className="w-5 h-5" />, title: t("claimPageBoumTitle"), desc: t("claimPageBoumDesc") },
                { icon: <Shield className="w-5 h-5" />, title: t("claimPageVipTitle"), desc: t("claimPageVipDesc") },
              ].map((item) => (
                <div key={item.title} className="flex items-start space-x-4 bg-black/30 rounded-xl p-4 border border-white/[0.05]">
                  <div className="text-wacke-cyan shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Countdown + CTA */}
        {!isClaimed && !isHeld && hoursRemaining > 0 && (
          <div className="flex items-center justify-center space-x-2 text-amber-400 text-sm font-bold mb-6">
            <Clock className="w-4 h-4" />
            <span>
              {language === "fr"
                ? `Réservation expire dans ${hoursRemaining}h`
                : `Hold expires in ${hoursRemaining}h`}
            </span>
          </div>
        )}

        {isHeld ? (
          <div className="text-center glass rounded-2xl p-6 border border-amber-500/30">
            <p className="text-amber-300 font-medium">{t("claimPageHeld")}</p>
          </div>
        ) : isClaimed ? (
          <div className="text-center">
            <Link
              href={`/profile/${username}`}
              className="inline-block bg-gradient-to-r from-wacke-cyan to-wacke-purple px-10 py-4 rounded-xl font-black text-lg hover:opacity-90 transition-all"
            >
              {t("claimPageViewProfile")}
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Link
              href={signupHref}
              className="inline-block w-full max-w-md bg-gradient-to-r from-wacke-pink to-wacke-purple px-10 py-4 rounded-xl font-black text-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-wacke-pink/20 uppercase tracking-wider"
            >
              {t("claimPageCta")} @{username}
            </Link>
            <p className="text-xs text-gray-500">{t("claimPageNoPressure")}</p>
          </div>
        )}
      </div>
    </main>
  );
}