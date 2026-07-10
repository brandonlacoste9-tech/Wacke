"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseMocked } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ParticleBackground from "@/components/ParticleBackground";
import { CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SignupPage() {
  const { signup, user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const router = useRouter();

  useEffect(() => {
    setIsMock(isSupabaseMocked());
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Simulate username availability check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(() => {
      // Mock check — in production would hit an API
      const taken = ["admin", "wacke", "gabriel", "sophie", "moderator"];
      setUsernameStatus(taken.includes(username.toLowerCase()) ? "taken" : "available");
    }, 600);

    return () => clearTimeout(timeout);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !displayName.trim()) {
      setErrorMsg(t("signupErrorEmpty"));
      return;
    }

    if (username.length > 32) {
      setErrorMsg(t("signupErrorLength"));
      return;
    }

    if (usernameStatus === "taken") {
      setErrorMsg(t("signupErrorTaken"));
      return;
    }

    if (!isMock && !email.trim()) {
      setErrorMsg(t("signupErrorEmail"));
      return;
    }

    const finalEmail = isMock ? `${username.trim()}@mock.wacke.ca` : email.trim();
    const res = await signup(username.trim().toLowerCase(), displayName.trim(), finalEmail);

    if (res.success) {
      if (isMock) {
        router.push("/");
      } else {
        setSuccessMsg(res.error || t("signupSuccessMessage"));
      }
    } else {
      setErrorMsg(res.error || t("signupErrorMessage"));
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-wacke-dark relative overflow-hidden">
      {/* ── Artwork Side (Left) ── */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center border-r border-wacke-purple/20">
        <img src="/login_artwork.jpg" alt="Cyberpunk City" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-wacke-dark z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-wacke-dark via-transparent to-transparent z-0" />
        <ParticleBackground count={12} />
        <div className="relative z-10 p-16 mt-auto self-end w-full">
          <h2 className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] mb-3 uppercase tracking-wide graffiti-text neon-cyan">{t("signupArtworkTitle")}</h2>
          <p className="text-xl text-gray-200 font-bold max-w-md drop-shadow-md">{t("signupArtworkSub")}</p>
        </div>
      </div>

      {/* ── Form Side (Right) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wacke-cyan/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full glass-dark p-10 rounded-3xl shadow-[0_0_40px_rgba(0,255,255,0.08)] relative z-10 animate-scale-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold graffiti-text neon-cyan mb-2">{t("signupTitle")}</h1>
            <p className="text-gray-500 text-sm font-medium">{t("signupSubtitle")}</p>
          </div>

          {errorMsg && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-300 animate-fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-500/30 rounded-xl text-sm text-green-300 animate-fade-in">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                {t("signupUsernameLabel")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="Ex: ti_coune_99"
                  maxLength={32}
                  className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3 pr-10
                             text-sm focus:border-wacke-cyan/40 transition-all"
                  disabled={isLoading}
                  required
                />
                {/* Username availability indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-[10px] text-red-400 mt-1 font-medium">{t("signupUsernameTaken")}</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-[10px] text-green-400 mt-1 font-medium">{t("signupUsernameAvailable")}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                {t("signupDisplayNameLabel")}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Ti-Coune 👑"
                maxLength={64}
                className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                           text-sm focus:border-wacke-cyan/40 transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {!isMock && (
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("signupEmailLabel")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@wacke.live"
                  className="w-full bg-white/3 border border-wacke-purple/20 rounded-xl px-4 py-3
                             text-sm focus:border-wacke-cyan/40 transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || usernameStatus === "taken"}
              className="w-full bg-gradient-to-r from-wacke-cyan to-wacke-purple py-4 rounded-xl
                         font-bold text-lg hover:opacity-90 transition-all mt-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-wacke-cyan/20"
            >
              {isLoading ? t("signupBtnRegistering") : t("signupBtnRegister")}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-wacke-purple/15 pt-6">
            <p className="text-sm text-gray-500">
              {t("signupAlreadyRegistered")}{" "}
              <Link href="/auth/login" className="text-wacke-pink font-bold hover:underline">
                {t("signupLoginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
