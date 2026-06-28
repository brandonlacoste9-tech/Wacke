"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseMocked } from "@/lib/config";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [mockUsername, setMockUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMock(isSupabaseMocked());
    // Redirect if already logged in
    if (user) {
      router.push("/dashboard/stream");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isMock) {
      if (!mockUsername.trim()) {
        setErrorMsg("Remplis ton nom d'utilisateur de test.");
        return;
      }
      const res = await login(`${mockUsername.trim()}@mock.wacke.ca`, mockUsername.trim());
      if (res.success) {
        router.push("/dashboard/stream");
      } else {
        setErrorMsg(res.error || "Erreur de connexion.");
      }
    } else {
      if (!email.trim()) {
        setErrorMsg("Donne ton adresse courriel.");
        return;
      }
      const res = await login(email.trim());
      if (res.success) {
        setSuccessMsg(res.error || "Lien de connexion envoyé! Valide ton courriel.");
      } else {
        setErrorMsg(res.error || "Erreur lors de l'envoi du lien.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-wacke-dark px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-wacke-pink/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-wacke-darker border border-wacke-purple/30 p-8 rounded-2xl neon-border relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold graffiti-text neon-pink mb-2">CONNEXION</h1>
          <p className="text-gray-400 text-sm">Prêt à sprayer ton feedback live? 🏪🔥</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {isMock ? (
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Pseudo de test (Mock Mode)
              </label>
              <input
                type="text"
                value={mockUsername}
                onChange={(e) => setMockUsername(e.target.value)}
                placeholder="Ex: kevin, tremblay_99"
                className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-xl px-4 py-3
                           text-sm text-white focus:outline-none focus:border-wacke-cyan/60 transition-colors"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Le mode mock est actif car les variables Supabase ne sont pas configurées. Connecte-toi instantanément!
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
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
              />
              <p className="text-xs text-gray-500 mt-2">
                On t&apos;enverra un lien magique pour te connecter en toute sécurité.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-wacke-pink to-wacke-purple py-4 rounded-xl
                       font-bold text-lg hover:opacity-90 transition-opacity
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Chargement..." : isMock ? "🚀 Connexion instantanée" : "Envoyer le lien magique"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-wacke-purple/20 pt-6">
          <p className="text-sm text-gray-400">
            Nouveau sur Wacké?{" "}
            <Link href="/auth/signup" className="text-wacke-cyan font-bold hover:underline">
              Crée un compte ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
