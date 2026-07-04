"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { language } = useLanguage();
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/";

      // If no code, check if there's an error in the URL parameters
      const urlError = searchParams.get("error");
      const urlErrorDescription = searchParams.get("error_description");

      if (urlError || urlErrorDescription) {
        console.error("[CALLBACK_PAGE] Supabase auth redirect error:", { urlError, urlErrorDescription });
        setErrorMsg(urlErrorDescription || urlError || "Authentification refusée.");
        setTimeout(() => {
          router.push(`/auth/login?error=callback_failed`);
        }, 3000);
        return;
      }

      if (!code) {
        // In some cases, there might be no code but the session could already be recovered on mount
        // Let's verify if the client-side session is active
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[CALLBACK_PAGE] Session already exists, syncing...");
          await syncAndRedirect(session.access_token, session.refresh_token, next);
        } else {
          console.error("[CALLBACK_PAGE] No code query parameter found in URL");
          setErrorMsg(language === "fr" ? "Aucun code d'authentification trouvé dans l'URL." : "No auth code found in the URL.");
          setTimeout(() => {
            router.push(`/auth/login?error=callback_failed`);
          }, 3000);
        }
        return;
      }

      setStatusMsg(language === "fr" ? "Vérification en cours..." : "Verifying code...");

      try {
        const supabase = getSupabaseClient();
        
        // This will automatically exchange the code using the PKCE verifier stored in localStorage!
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          console.error("[CALLBACK_PAGE] exchangeCodeForSession failed:", error);
          setErrorMsg(
            (error?.message || "Échec de l'échange de code.") + 
            " (Assurez-vous de ne pas réutiliser le lien)"
          );
          setTimeout(() => {
            router.push(`/auth/login?error=callback_failed`);
          }, 4000);
          return;
        }

        await syncAndRedirect(data.session.access_token, data.session.refresh_token, next);
      } catch (err: any) {
        console.error("[CALLBACK_PAGE] Unexpected error:", err);
        setErrorMsg(err?.message || "Une erreur inattendue est survenue.");
        setTimeout(() => {
          router.push(`/auth/login?error=callback_failed`);
        }, 4000);
      }
    }

    async function syncAndRedirect(accessToken: string, refreshToken: string | undefined, next: string) {
      // Set cookies locally on the client (so middleware and Server Components can see them)
      const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
      document.cookie = `wacke_token=${accessToken}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
      if (refreshToken) {
        document.cookie = `wacke_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
      }

      // Keep Supabase client session in sync
      const supabase = getSupabaseClient();
      if (refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      // Sync with our database profile
      setStatusMsg(language === "fr" ? "Synchronisation du profil..." : "Syncing profile...");
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!syncRes.ok) {
        const syncErr = await syncRes.json().catch(() => ({}));
        console.error("[CALLBACK_PAGE] API sync failed:", syncErr);
        setErrorMsg(syncErr.details || syncErr.error || "La synchronisation du compte a échoué.");
        setTimeout(() => {
          router.push(`/auth/login?error=callback_failed`);
        }, 4000);
        return;
      }

      // Refresh AuthProvider user state
      await refreshUser();

      // Successfully authenticated!
      setStatusMsg(language === "fr" ? "Connexion réussie ! Redirection..." : "Success! Redirecting...");
      router.push(next);
    }

    handleCallback();
  }, [router, searchParams, refreshUser, language]);

  return (
    <div className="max-w-md w-full glass-dark p-10 rounded-3xl shadow-[0_0_40px_rgba(255,0,255,0.1)] relative z-10 text-center space-y-6 animate-scale-in">
      {errorMsg ? (
        <>
          <div className="w-16 h-16 bg-red-900/30 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse text-2xl font-black">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-red-400 uppercase tracking-wider">
            {language === "fr" ? "Erreur de Connexion" : "Login Error"}
          </h2>
          <p className="text-gray-300 font-mono text-sm break-words px-2">{errorMsg}</p>
          <p className="text-xs text-gray-500 italic">
            {language === "fr" ? "Redirection vers la page de connexion..." : "Redirecting to login..."}
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 border-4 border-wacke-pink border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-2xl font-bold graffiti-text neon-pink uppercase tracking-wider">
            WACKÉ AUTH
          </h2>
          <p className="text-gray-400 font-mono text-sm">{statusMsg || (language === "fr" ? "Préparation..." : "Preparing...")}</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-wacke-dark relative overflow-hidden items-center justify-center">
      {/* Background artwork/visual effects matching login */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-wacke-pink/5 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <>
          <div className="w-16 h-16 border-4 border-wacke-pink border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-2xl font-bold graffiti-text neon-pink uppercase tracking-wider">
            WACKÉ AUTH
          </h2>
          <p className="text-gray-400 font-mono text-sm">Chargement / Loading...</p>
        </>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
