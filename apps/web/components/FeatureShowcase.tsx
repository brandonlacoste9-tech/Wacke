"use client";

import { Flame, Shield, Coins, Bot } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

/**
 * FeatureShowcase — "Why Wacké?" section for the home page.
 * 3 premium glassmorphism cards with icons and descriptions.
 */
export default function FeatureShowcase() {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Flame className="w-8 h-8" />,
      title: t("feature1Title"),
      subtitle: t("feature1Sub"),
      description: t("feature1Desc"),
      gradient: "from-wacke-pink to-rose-600",
      glow: "rgba(255, 20, 147, 0.3)",
      borderColor: "border-wacke-pink/20",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t("feature2Title"),
      subtitle: t("feature2Sub"),
      description: t("feature2Desc"),
      gradient: "from-wacke-purple to-violet-600",
      glow: "rgba(139, 0, 255, 0.3)",
      borderColor: "border-wacke-purple/20",
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: t("feature3Title"),
      subtitle: t("feature3Sub"),
      description: t("feature3Desc"),
      gradient: "from-yellow-500 to-amber-600",
      glow: "rgba(255, 215, 0, 0.3)",
      borderColor: "border-yellow-500/20",
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "GROKÉ AI",
      subtitle: "Maximum Wit. Maximum Chaos.",
      description: "Ask Groké (powered by xAI energy) for roasts, stream ideas, wild chaos suggestions & unfiltered advice. The only AI that speaks fluent wacké.",
      gradient: "from-cyan-400 to-purple-500",
      glow: "rgba(0, 255, 255, 0.3)",
      borderColor: "border-wacke-cyan/30",
    },
  ];

  return (
    <section className="px-8 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight mb-3 text-white">
          <span className="gradient-text-cyber">{t("whyWacke")}</span>
        </h2>
        <p className="text-gray-300 text-sm max-w-lg mx-auto">
          {t("whyWackeSub")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`glass-card rounded-2xl p-8 flex flex-col items-start group
                       hover:shadow-[0_0_40px_${feature.glow}] transition-all duration-500`}
          >
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient}
                         flex items-center justify-center text-white mb-5
                         group-hover:scale-110 transition-transform duration-300
                         shadow-lg`}
            >
              {feature.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-1 font-display tracking-tight">
              {feature.title}
            </h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {feature.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-300 leading-relaxed flex-1">
              {feature.description}
            </p>

            {/* Decorative line */}
            <div
              className={`h-0.5 w-12 bg-gradient-to-r ${feature.gradient} rounded-full mt-6
                         group-hover:w-20 transition-all duration-500`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
