"use client";

import { Bot } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ExternalStreamBannerProps {
  platform: "kick" | "twitch";
  streamerName: string;
}

export default function ExternalStreamBanner({ platform, streamerName }: ExternalStreamBannerProps) {
  const { t } = useLanguage();
  const platformLabel = platform === "kick" ? "Kick" : "Twitch";
  const accent = platform === "kick" ? "border-wacke-green/40 bg-wacke-green/5" : "border-[#9146ff]/40 bg-[#9146ff]/5";

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border ${accent} mb-4`}>
      <Bot className="w-5 h-5 text-wacke-cyan shrink-0" />
      <p className="text-sm text-gray-200">
        <span className="font-bold text-white">{streamerName}</span>
        {" "}{t("externalBannerWatching")}{" "}
        <span className="font-bold" style={{ color: platform === "kick" ? "#53fc18" : "#9146ff" }}>
          {platformLabel}
        </span>
        {" "}— {t("externalBannerGrok")}
      </p>
    </div>
  );
}