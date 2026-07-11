"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { CheckCircle, Copy, Monitor, Radio, Share2 } from "lucide-react";

function OnboardingContent() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  const username = user?.username ?? searchParams.get("username") ?? "";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${username}`
    : `https://wacke.live/${username}`;
  const overlayUrl = typeof window !== "undefined"
    ? `${window.location.origin}/stream/${username}/overlay`
    : `https://wacke.live/stream/${username}/overlay`;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const finish = () => {
    try { localStorage.setItem("wacke_onboarded", "1"); } catch { /* ignore */ }
    router.push("/dashboard/studio");
  };

  if (isLoading || !user) {
    return <div className="p-12 text-center animate-pulse text-gray-400">{t("onboardingLoading")}</div>;
  }

  const steps = [
    {
      num: 1,
      icon: <CheckCircle className="w-8 h-8 text-green-400" />,
      title: t("onboardingStep1Title"),
      desc: t("onboardingStep1Desc"),
      content: (
        <div className="glass rounded-xl p-6 border border-green-500/30 text-center">
          <p className="text-3xl font-black gradient-text-cyber mb-2">@{username}</p>
          <p className="text-gray-400 text-sm">{t("onboardingStep1Locked")}</p>
        </div>
      ),
    },
    {
      num: 2,
      icon: <Radio className="w-8 h-8 text-wacke-pink" />,
      title: t("onboardingStep2Title"),
      desc: t("onboardingStep2Desc"),
      content: (
        <div className="space-y-3">
          <Link
            href="/dashboard/studio"
            className="block w-full text-center py-4 bg-gradient-to-r from-wacke-pink to-wacke-purple rounded-xl font-black text-lg hover:opacity-90 transition-all"
          >
            {t("onboardingGoStudio")}
          </Link>
          <p className="text-xs text-gray-500 text-center">{t("onboardingObsNote")}</p>
        </div>
      ),
    },
    {
      num: 3,
      icon: <Share2 className="w-8 h-8 text-wacke-cyan" />,
      title: t("onboardingStep3Title"),
      desc: t("onboardingStep3Desc"),
      content: (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/[0.06]">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("onboardingShareLink")}</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-sm text-wacke-cyan truncate">{shareUrl}</code>
              <button
                onClick={() => copyText(shareUrl, "share")}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied === "share" && <p className="text-xs text-green-400 mt-1">{t("onboardingCopied")}</p>}
          </div>
          <div className="glass rounded-xl p-4 border border-white/[0.06]">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center space-x-1">
              <Monitor className="w-3.5 h-3.5" />
              <span>{t("onboardingOverlayLink")}</span>
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-sm text-gray-300 truncate text-[11px]">{overlayUrl}</code>
              <button
                onClick={() => copyText(overlayUrl, "overlay")}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied === "overlay" && <p className="text-xs text-green-400 mt-1">{t("onboardingCopied")}</p>}
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step - 1];

  return (
    <main className="min-h-screen bg-wacke-dark flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-center space-x-2 mb-10">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`h-1.5 rounded-full transition-all ${
                s.num <= step ? "w-12 bg-wacke-pink" : "w-6 bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">{current.icon}</div>
          <h1 className="text-2xl font-black text-white mb-2">{current.title}</h1>
          <p className="text-gray-400 text-sm">{current.desc}</p>
        </div>

        <div className="mb-8">{current.content}</div>

        <div className="flex space-x-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all"
            >
              {t("onboardingBack")}
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-wacke-cyan to-wacke-purple font-bold hover:opacity-90 transition-all"
            >
              {t("onboardingNext")}
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-wacke-pink to-wacke-purple font-black hover:opacity-90 transition-all"
            >
              {t("onboardingFinish")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center animate-pulse">...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}