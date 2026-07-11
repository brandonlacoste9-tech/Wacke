"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";

interface TokenShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TokenShopModal({ isOpen, onClose }: TokenShopModalProps) {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePurchase = async (amount: number) => {
    if (!token) {
      setErrorMsg(t("loginToBuy"));
      return;
    }

    setLoadingAmount(amount);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/tokens/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("stripeError"));
      }

      if (data.url) {
        // Redirect browser to Checkout URL (could be real Stripe or mock sandbox success URL)
        window.location.href = data.url;
      } else {
        throw new Error(t("paymentUrlMissing"));
      }
    } catch (err: any) {
      setErrorMsg(err.message || t("connectionError"));
      setLoadingAmount(null);
    }
  };

  const PACKS = [
    { amount: 1000, price: "$1.99", unit: "CAD", badge: "🍟 Chips Pack", perk: t("perkSpray") ?? "Spray emotes" },
    { amount: 5000, price: "$4.99", unit: "CAD", badge: "🍺 Pinte Pack", perk: t("perkSacres") ?? "Unlock sacres", popular: true },
    { amount: 10000, price: "$8.99", unit: "CAD", badge: "📦 Caisse Pack", perk: t("perkVIP") ?? "VIP badge", bestValue: true },
    { amount: 25000, price: "$17.99", unit: "CAD", badge: "👑 Gérant Pack", perk: t("perkBoss") ?? "AI roast boost" },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex flex-col items-center p-4">
      {/* Background glass blur overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative glass-dark my-4 sm:my-auto w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl p-7 shadow-2xl border border-white/[0.07] animate-scale-in z-10">
        {/* Neon Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-wacke-pink via-wacke-purple to-wacke-cyan" />

        <div className="flex items-start justify-between mb-1.5">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white font-display leading-none">
              {t("shopTitle")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-base"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          {t("shopSubtitle")}
        </p>

        {errorMsg && (
          <div className="mb-4 text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/25 p-3 rounded-xl animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
          {PACKS.map((pack) => {
            const isLoading = loadingAmount === pack.amount;

            return (
              <div
                key={pack.amount}
                className={`relative flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300
                          ${
                            pack.bestValue
                              ? "bg-wacke-pink/[0.06] border-wacke-pink/35 shadow-lg shadow-wacke-pink/5"
                              : pack.popular
                                ? "bg-wacke-purple/10 border-wacke-purple/35"
                                : "bg-white/[0.02] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
              >
                {pack.popular && !pack.bestValue && (
                  <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-wacke-pink to-wacke-purple text-[9px] font-black text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                    🔥 {t("popular")}
                  </span>
                )}
                {pack.bestValue && (
                  <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-wacke-cyan to-wacke-pink text-[9px] font-black text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                    ⭐ {t("bestValue")}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold text-gray-500 uppercase mb-1 tracking-wide">{pack.badge}</p>
                  <p className="text-xl font-black text-white flex items-center space-x-1.5 leading-none">
                    <span>{pack.amount.toLocaleString()}</span>
                    <span className="text-yellow-400 text-base">🪙</span>
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5 truncate">{pack.perk}</p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <p className="text-sm font-bold text-white">{pack.price}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide -mt-1">{pack.unit}</p>
                  <button
                    onClick={() => handlePurchase(pack.amount)}
                    disabled={loadingAmount !== null}
                    className={`text-xs font-black px-4 py-2 rounded-xl transition-all duration-200
                              ${
                                pack.bestValue
                                  ? "bg-gradient-to-r from-wacke-pink to-wacke-purple text-white shadow-lg shadow-wacke-pink/15 hover:brightness-110 active:scale-95"
                                  : pack.popular
                                    ? "bg-white/15 hover:bg-white/25 text-white active:scale-95"
                                    : "bg-white/[0.06] hover:bg-white/15 text-white active:scale-95"
                              } disabled:opacity-40`}
                  >
                    {isLoading ? t("loadingCheckout") : t("buyBtn")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.07] flex justify-between items-center">
          <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t("securedByStripe")}</span>
          </div>
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">
            © Wacké Corp.
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
