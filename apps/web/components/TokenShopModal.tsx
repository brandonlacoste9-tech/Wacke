"use client";

import { useState } from "react";
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

  if (!isOpen) return null;

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
    { amount: 1000, price: "$1.99 CAD", badge: "🍟 Chips Pack" },
    { amount: 5000, price: "$4.99 CAD", badge: "🍺 Pinte Pack", popular: true },
    { amount: 10000, price: "$8.99 CAD", badge: "📦 Caisse Pack" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background glass blur overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Center wrapper */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Container */}
        <div className="relative glass-dark w-full max-w-md rounded-2xl p-6 shadow-2xl border border-wacke-pink/20 animate-scale-in z-10">
          {/* Neon Glow Lines */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wacke-pink via-wacke-purple to-wacke-cyan" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black tracking-wider text-white uppercase font-sans">
            {t("shopTitle")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          {t("shopSubtitle")}
        </p>

        {errorMsg && (
          <div className="mb-4 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 p-3 rounded-xl animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          {PACKS.map((pack) => {
            const isLoading = loadingAmount === pack.amount;

            return (
              <div
                key={pack.amount}
                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                           ${
                             pack.popular
                               ? "bg-wacke-purple/10 border-wacke-pink/35 shadow-lg shadow-wacke-pink/5"
                               : "bg-white/2 border-white/5 hover:border-wacke-purple/30 hover:bg-white/4"
                           }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 right-4 bg-gradient-to-r from-wacke-pink to-wacke-purple text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    🔥 {t("popular")}
                  </span>
                )}

                <div>
                  <p className="text-[10px] font-extrabold text-gray-500 uppercase mb-0.5">{pack.badge}</p>
                  <p className="text-base font-black text-white flex items-center space-x-1.5">
                    <span>{pack.amount.toLocaleString()}</span>
                    <span className="text-yellow-400">🪙</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold mb-1.5">{pack.price}</p>
                  <button
                    onClick={() => handlePurchase(pack.amount)}
                    disabled={loadingAmount !== null}
                    className={`text-xs font-black px-4 py-1.5 rounded-xl transition-all duration-200 shrink-0
                               ${
                                 pack.popular
                                   ? "bg-gradient-to-r from-wacke-pink to-wacke-purple text-white shadow-lg shadow-wacke-pink/10 hover:brightness-110 active:scale-95"
                                   : "bg-white/10 hover:bg-white/20 text-white active:scale-95"
                               } disabled:opacity-40`}
                  >
                    {isLoading ? t("loadingCheckout") : t("buyBtn")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-wacke-purple/10 flex justify-between items-center">
          <div className="flex items-center space-x-1.5 text-[9px] text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t("securedByStripe")}</span>
          </div>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">
            © Wacké Corp.
          </span>
        </div>
      </div>
    </div>
    </div>
  );
}
