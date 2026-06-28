"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseMocked } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { signup, user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMock(isSupabaseMocked());
    if (user) {
      router.push("/dashboard/stream");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !displayName.trim()) {
      setErrorMsg("Remplis ton pseudo et ton nom d'affichage.");
      return;
    }

    if (username.length > 32) {
      setErrorMsg("Le pseudo doit faire max 32 caractères.");
      return;
    }

    if (!isMock && !email.trim()) {
      setErrorMsg("Donne ton adresse courriel.");
      return;
    }

    const finalEmail = isMock ? `${username.trim()}@mock.wacke.ca` : email.trim();
    const res = await signup(username.trim().toLowerCase(), displayName.trim(), finalEmail);

    if (res.success) {
      if (isMock) {
        router.push("/dashboard/stream");
      } else {
        setSuccessMsg(res.error || "Compte créé! Valide tes courriels pour activer ta session.");
      }
    } else {
      setErrorMsg(res.error || "Erreur de création du compte.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-wacke-dark px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wacke-pink/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-wacke-darker border border-wacke-purple/30 p-8 rounded-2xl neon-border relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold graffiti-text neon-cyan mb-2">INSCRIPTION</h1>
          <p className="text-gray-400 text-sm font-medium">Rejoins la meute de Wacké! 🐺🎨</p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-xl text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-900/40 border border-green-500/40 rounded-xl text-sm text-green-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1.5">
              Nom d&apos;utilisateur (Pseudo unique)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="Ex: ti_coune_99"
              maxLength={32}
              className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                         text-sm text-white focus:outline-none focus:border-wacke-cyan/60 transition-colors"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1.5">
              Nom d&apos;affichage (Display Name)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Ti-Coune 👑"
              maxLength={64}
              className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                         text-sm text-white focus:outline-none focus:border-wacke-cyan/60 transition-colors"
              disabled={isLoading}
              required
            />
          </div>

          {!isMock && (
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1.5">
                Adresse courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chum@wacke.ca"
                className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                           text-sm text-white focus:outline-none focus:border-wacke-cyan/60 transition-colors"
                disabled={isLoading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-wacke-cyan to-wacke-purple py-4 rounded-xl
                       font-bold text-lg hover:opacity-90 transition-opacity mt-4
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Création en cours..." : "🔥 S'inscrire maintenant"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-wacke-purple/20 pt-6">
          <p className="text-sm text-gray-400">
            Déjà inscrit?{" "}
            <Link href="/auth/login" className="text-wacke-pink font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
