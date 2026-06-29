"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, claimDailyTokens, isLoading } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setClaiming(true);
    const res = await claimDailyTokens();
    setClaiming(false);
    
    if (res.success) {
      setFeedback("+500 🪙");
    } else {
      setFeedback("Déjà pris!");
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Toast Feedback for Claiming */}
      {feedback && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-wacke-pink border border-white/20 text-white font-extrabold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce z-50">
          {feedback}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-wacke-darker/90 backdrop-blur-md border-t border-wacke-purple/30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors
                       ${isActive("/") ? "text-wacke-pink" : "text-gray-400 hover:text-gray-200"}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold mt-1">Accueil</span>
          </Link>

          {/* Browse */}
          <Link
            href="/browse"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors
                       ${isActive("/browse") ? "text-wacke-cyan" : "text-gray-400 hover:text-gray-200"}`}
          >
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-bold mt-1">Parcourir</span>
          </Link>

          {/* Claim Tokens Button */}
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <div className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 border-4 border-wacke-dark flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95">
              <span className="text-xl">🪙</span>
            </div>
            <span className="text-[10px] font-extrabold text-yellow-400 mt-1">
              {user ? `${user.tokenBalance}` : "Réclamer"}
            </span>
          </button>

          {/* Dashboard/Streamer */}
          <Link
            href="/dashboard/stream"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors
                       ${isActive("/dashboard/stream") ? "text-wacke-pink" : "text-gray-400 hover:text-gray-200"}`}
          >
            <span className="text-xl">🔴</span>
            <span className="text-[10px] font-bold mt-1">Streamer</span>
          </Link>

          {/* Account/Profile */}
          <Link
            href={user ? "/dashboard/stream" : "/auth/login"}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-gray-200"
          >
            {user ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-black text-white uppercase border border-white/20">
                {user.username.substring(0, 2)}
              </div>
            ) : (
              <span className="text-xl">👤</span>
            )}
            <span className="text-[10px] font-bold mt-1">Compte</span>
          </Link>
        </div>
      </div>
    </>
  );
}
