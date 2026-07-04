"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseMocked } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ParticleBackground from "@/components/ParticleBackground";
import { useLanguage } from "@/components/LanguageProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Bot } from "lucide-react";

export default function LoginPage() {
  const { login, user, isLoading, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [mockUsername, setMockUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  
  // OTP verification states
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setIsMock(isSupabaseMocked());
    // Redirect if already logged in
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isMock) {
      if (!mockUsername.trim()) {
        setErrorMsg(t("loginErrorEmptyPseudo"));
        return;
      }
      const res = await login(`${mockUsername.trim()}@mock.wacke.ca`, mockUsername.trim());
      if (res.success) {
        router.push("/");
      } else {
        setErrorMsg(res.error || t("loginErrorFetch"));
      }
    } else {
      if (!email.trim()) {
        setErrorMsg(t("loginErrorEmptyEmail"));
        return;
      }
      const res = await login(email.trim());
      if (res.success) {
        setSuccessMsg(language === "fr" ? "Code de validation envoyé par email ! Vérifie ta boîte (et les spams)." : "Verification code sent by email! Check your inbox (and spam).");
        setCodeSent(true); // Show OTP code verification form
      } else {
        setErrorMsg(res.error || t("loginErrorMagicLink"));
      }
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingOtp(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(language === "fr" ? "Nouveau code envoyé ! Vérifie tes emails (y compris les spams)." : "New code sent! Check your emails (including spam).");
      }
    } catch (err) {
      setErrorMsg(language === "fr" ? "Erreur lors du renvoi du code." : "Error resending code.");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg(language === "fr" ? "Le code doit faire 6 chiffres." : "Verification code must be 6 digits.");
      return;
    }
    
    setIsLoadingOtp(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });

      if (error || !data.session) {
        setErrorMsg(error?.message || (language === "fr" ? "Code de validation invalide ou expiré." : "Invalid or expired verification code."));
        return;
      }

      // Save token in cookie (access + refresh for long term)
      const { access_token, refresh_token } = data.session;
      const secureFlag = process.env.NODE_ENV === "production" ? ";secure" : "";
      document.cookie = `wacke_token=${access_token};path=/;max-age=604800;SameSite=Lax${secureFlag}`;
      if (refresh_token) {
        document.cookie = `wacke_refresh_token=${refresh_token};path=/;max-age=604800;SameSite=Lax${secureFlag}`;
      }
      
      // Keep Supabase client session in sync
      const supabase = getSupabaseClient();
      if (refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
      
      // Sync user profile from auth token
      await refreshUser();
      router.push("/");
    } catch (err) {
      console.error("[OTP_VERIFICATION_ERROR]", err);
      setErrorMsg(language === "fr" ? "Erreur lors de la validation du code." : "Failed to verify code.");
    } finally {
      setIsLoadingOtp(false);
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
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 animate-fade-in break-words">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-500/30 rounded-xl text-sm text-green-300 animate-fade-in break-words">
            {successMsg}
          </div>
        )}

        <div className="space-y-6">
          {!codeSent ? (
            <>
              {/* Prioritized Kick Login Button */}
              <div>
                <a
                  href="/api/auth/kick/login"
                  className="w-full bg-[#53fc18] text-black hover:scale-[1.02] active:scale-[0.98] transition-all py-4 rounded-xl
                             font-bold text-lg flex items-center justify-center space-x-2
                             shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:shadow-[0_0_30px_rgba(83,252,24,0.5)]"
                >
                  <span>🟢</span>
                  <span>{t("loginWithKick")}</span>
                  <span className="bg-black text-[#53fc18] text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ml-2 border border-[#53fc18]/30 animate-pulse">
                    {t("recommendedLabel")}
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
                  disabled
                  className="flex items-center justify-center space-x-2 bg-white/3 border border-white/10 py-3 rounded-xl text-sm text-gray-400 cursor-not-allowed opacity-50 font-medium"
                  title="Bientôt disponible"
                >
                  <span>🔵</span>
                  <span>Google</span>
                </button>
              </div>

              {/* GROK TOUCH: Epic Demo Login — go wild mode */}
              <button
                type="button"
                onClick={async () => {
                  const demoNames = ["ti_grok", "depaneurAI", "wacke_max", "sacre_bot", "xai_quebec"];
                  const pick = demoNames[Math.floor(Math.random() * demoNames.length)];
                  const res = await login(`${pick}@mock.wacke.ca`, pick);
                  if (res.success) {
                    router.push("/");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-black via-wacke-cyan to-black border border-wacke-cyan/50 text-white py-3.5 rounded-xl font-extrabold text-sm hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]"
              >
                <Bot className="w-4 h-4" /> 🚀 LOGIN AS GROKÉ DEMO (INSTANT CHAOS)
              </button>

              <div className="flex items-center my-2">
                <hr className="flex-grow border-t border-wacke-purple/15" />
                <span className="px-3 text-[10px] text-gray-600 uppercase tracking-wider font-bold">{t("orContinueWith")}</span>
                <hr className="flex-grow border-t border-wacke-purple/15" />
              </div>

              {/* Standard Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {isMock ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      {t("testPseudoLabel")}
                    </label>
                    <input
                      type="text"
                      value={mockUsername}
                      onChange={(e) => setMockUsername(e.target.value)}
                      placeholder="Ex: kevin, tremblay_99"
                      className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                                 text-sm focus:border-wacke-cyan/40 transition-all"
                      disabled={isLoading}
                    />
                    <p className="text-[10px] text-gray-600 mt-2">
                      {t("mockModeNotice")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      {t("emailLabel")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="chum@wacke.ca"
                      className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                                 text-sm focus:border-wacke-cyan/40 transition-all"
                      disabled={isLoading}
                      required
                    />
                    <p className="text-[10px] text-gray-600 mt-2">
                      {language === "fr" ? "On t'enverra un code de validation à 6 chiffres par email (vérifie les spams)." : "We'll send a 6-digit verification code by email (check spam)."}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl
                             font-bold text-lg hover:opacity-90 transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-lg shadow-wacke-pink/20"
                >
                  {isLoading ? t("btnLoading") : isMock ? t("btnInstantConnect") : t("btnSendMagicLink")}
                </button>
              </form>
            </>
          ) : (
            /* ── OTP Verification Form ── */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-scale-in">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  {t("loginEnterCode")}
                </label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={t("loginOtpPlaceholder")}
                  className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                             text-center text-2xl font-mono font-black tracking-widest text-wacke-pink
                             focus:border-wacke-pink/40 transition-all"
                  disabled={isLoadingOtp}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingOtp || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl
                           font-bold text-lg hover:opacity-90 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg shadow-wacke-pink/20"
              >
                {isLoadingOtp ? t("btnLoading") : t("loginVerifyBtn")}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isLoadingOtp}
                className="w-full text-center text-xs font-bold text-wacke-cyan hover:text-wacke-pink transition-colors py-2"
              >
                {language === "fr" ? "Renvoyer le code" : "Resend code"}
              </button>

              <button
                type="button"
                onClick={() => setCodeSent(false)}
                className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors py-2"
                disabled={isLoadingOtp}
              >
                {t("loginBackBtn")}
              </button>
            </form>
          )}
        </div>

        {!codeSent && (
          <div className="mt-8 text-center border-t border-wacke-purple/15 pt-6">
            <p className="text-sm text-gray-500">
              {t("noAccountYet")}{" "}
              <Link href="/auth/signup" className="text-wacke-cyan font-bold hover:underline">
                {t("createAccountHere")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
