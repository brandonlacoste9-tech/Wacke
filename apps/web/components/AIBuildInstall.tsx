"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Terminal, Copy, Check, X } from "lucide-react";

/**
 * AI Build — install banner for the AI CLI.
 * Mirrors xAI's official install cards: PowerShell (Windows) + WSL/Linux tabs,
 * one-click copy. Placed near the bottom of the homepage.
 */
export default function AIBuildInstall() {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<"powershell" | "wsl">("powershell");
  const [copied, setCopied] = useState(false);

  const isEn = language === "en";

  const commands: Record<"powershell" | "wsl", string> = {
    powershell: "irm https://x.ai/cli/install.ps1 | iex",
    wsl: "curl -fsSL https://x.ai/cli/install.sh | bash",
  };

  const tabs = [
    {
      id: "powershell" as const,
      label: isEn ? "PowerShell" : "PowerShell",
      sub: isEn ? "Windows" : "Windows",
    },
    {
      id: "wsl" as const,
      label: "WSL",
      sub: isEn ? "Linux / WSL" : "Linux / WSL",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands[tab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="px-6 lg:px-8 pb-16 pt-4 max-w-5xl mx-auto">
      <div className="relative rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* glow accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-wacke-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-wacke-pink/10 blur-3xl" />

        <div className="relative z-10 p-6 md:p-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-wacke-cyan/10 border border-wacke-cyan/25 text-wacke-cyan">
                  <Terminal className="w-5 h-5" />
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
                  AI Build
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-400 bg-orange-500/10">
                  Beta
                </span>
              </div>
              <p className="text-sm md:text-base text-gray-400 max-w-md leading-relaxed">
                {isEn
                  ? "Build with AI right from your terminal. Powered by AI 4.5 — the command-line side of the Wacké × AI xAI chaos."
                  : "Code avec AI directement depuis ton terminal. Propulsé par AI 4.5 — le côté ligne de commande du chaos Wacké × AI xAI."}
              </p>
            </div>

            {/* Tabs */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/[0.07] bg-black/30 shrink-0">
              {tabs.map((tb) => {
                const active = tab === tb.id;
                return (
                  <button
                    key={tb.id}
                    onClick={() => setTab(tb.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      active
                        ? "bg-white/[0.06] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                    aria-pressed={active}
                  >
                    {tb.label}
                    <span className="hidden md:inline ml-1.5 text-[10px] font-medium opacity-60">
                      {tb.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Command box */}
          <div className="group relative rounded-xl border border-white/[0.07] bg-black/50 overflow-hidden">
            {/* window dots */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05] bg-black/30">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="ml-2 text-[11px] font-mono text-gray-600">
                {tab === "powershell" ? "powershell" : "bash"} — AI install
              </span>
            </div>

            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-wacke-pink font-mono text-sm select-none shrink-0">$</span>
              <code className="flex-1 font-mono text-sm md:text-[15px] text-gray-100 break-all leading-relaxed">
                {commands[tab]}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-bold text-gray-300 hover:text-white hover:border-wacke-cyan/30 hover:bg-wacke-cyan/5 transition-all duration-200"
                aria-label={isEn ? "Copy command" : "Copier la commande"}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    {isEn ? "Copied" : "Copié"}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {isEn ? "Copy" : "Copier"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footnote */}
          <p className="mt-4 text-[11px] text-gray-600 leading-relaxed">
            {isEn
              ? "Runs the official xAI installer. macOS coming soon — for now use WSL on Windows or your Linux shell."
              : "Lance l'installateur officiel xAI. macOS bientôt — en attendant utilise WSL sur Windows ou ton shell Linux."}
          </p>
        </div>
      </div>
    </section>
  );
}
