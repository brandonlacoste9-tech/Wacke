"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseMocked } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ParticleBackground from "@/components/ParticleBackground";
import { useLanguage } from "@/components/LanguageProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const { login, user } = useAuth();
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setIsMock(isSupabaseMocked());
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error === 'callback_failed') {
        setErrorMsg('Login failed: invalid or expired token. Make sure https://wacke.live and /auth/callback are in Supabase Redirect URLs, then try again with a fresh code.');
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);

    if (isMock) {
      const mockGoogleUser = "google_user_" + Math.random().toString(36).substring(5);
      const res = await login(`${mockGoogleUser}@gmail.com`, mockGoogleUser);
      if (res.success) {
        router.push("/");
      } else {
        setErrorMsg("Mock Google login failed - check console");
      }
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const redirectTo = typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000/auth/callback"
        : "https://wacke.live/auth/callback";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      console.error("[GOOGLE_LOGIN_ERROR]", err);
      setErrorMsg(err.message || "Failed to initiate Google login.");
    }
  };


  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-wacke-dark relative overflow-hidden">
      {/* ── Artwork Side (Left) ── */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center border-r border-wacke-purple/20">
        <img src="/login_artwork.jpg" alt="Cyberpunk City" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-wacke-dark z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-wacke-dark via-transparent to-transparent z-0" />
        <ParticleBackground count={15} />
        <div className="relative z-10 p-16 mt-auto self-end w-full">
          <h2 className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] mb-3 uppercase tracking-wide graffiti-text neon-pink">{t("signupArtworkTitle")}</h2>
          <p className="text-xl text-gray-200 font-bold max-w-md drop-shadow-md">{t("heroSubtitle")}</p>
        </div>
      </div>

      {/* ── Form Side (Right) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-wacke-pink/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full glass-dark p-10 rounded-3xl shadow-[0_0_40px_rgba(255,0,255,0.1)] relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold graffiti-text neon-pink mb-2">{t("loginTitle")}</h1>
          <p className="text-gray-500 text-sm font-medium">{t("loginSubtitle")}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 animate-fade-in break-words">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Prioritized Kick Login Button */}
          <div>
            <a
              href="/api/auth/kick/login"
              className="w-full bg-[#53fc18] text-black hover:scale-[1.02] active:scale-[0.98] transition-all py-4 rounded-xl
                         font-bold text-lg flex items-center justify-center space-x-2
                         shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)] kick-element"
            >
              <span className="emoji text-2xl">🟢</span>
              <span>{t("loginWithKick")}</span>
              <span className="bg-black text-[#53fc18] text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ml-2 border border-[#53fc18]/30 animate-pulse emoji">
                RECOMMENDED 🔥
              </span>
            </a>
          </div>

          {/* Social Login Placeholders */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="flex items-center justify-center space-x-2 bg-white/3 border border-white/10 py-3 rounded-xl text-sm text-gray-400 cursor-not-allowed opacity-50 font-medium"
              title="Bientôt disponible"
            >
              <span>🟣</span>
              <span>Discord</span>
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center space-x-2 bg-white/5 border border-white/10 py-3 rounded-xl text-sm text-white hover:bg-white/10 active:scale-[0.98] transition-all font-bold"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
