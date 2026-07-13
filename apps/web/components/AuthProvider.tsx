"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseMocked } from "@/lib/config";
import { useRouter } from "next/navigation";

// Type definitions matching packages/db schema
export interface DBUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  supabaseId: string | null;
  tokenBalance: number;
  isStreamer: boolean;
  isBanned: boolean;
  isModerator: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextProps {
  user: DBUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, displayName: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  claimDailyTokens: () => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Helper functions for client-side cookies
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieVal = parts.pop()?.split(";").shift();
    return cookieVal ? decodeURIComponent(cookieVal) : null;
  }
  return null;
}

function getRefreshCookie(): string | null {
  return getCookie("wacke_refresh_token");
}

function setCookie(name: string, val: string, days = 7) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  // Correct cookie flags: space separated, " Secure" (capital) when in prod
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${val}; path=/; expires=${date.toUTCString()}; SameSite=Lax${secureFlag}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ─── Refresh User Data ───────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    let activeToken = token || getCookie("wacke_token");
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (isSupabaseMocked()) {
      // Mock mode: just re-sync the token
      try {
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(activeToken);
        } else {
          deleteCookie("wacke_token");
          deleteCookie("wacke_refresh_token");
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Mock refresh error:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Real mode
    try {
      let res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        // Try to refresh the token
        const refreshTok = getRefreshCookie();
        if (refreshTok) {
          const supabase = getSupabaseClient();
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshTok,
          });

          if (!refreshError && refreshData.session) {
            const newAccess = refreshData.session.access_token;
            const newRefresh = refreshData.session.refresh_token;

            const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
            document.cookie = `wacke_token=${newAccess}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
            if (newRefresh) {
              document.cookie = `wacke_refresh_token=${newRefresh}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
            }

            activeToken = newAccess;
            setToken(activeToken);

            res = await fetch("/api/auth/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${activeToken}`,
              },
            });
          }
        }
      }

      if (res.ok && activeToken) {
        const data = await res.json();
        setUser(data.user);
        setToken(activeToken);
        setCookie("wacke_token", activeToken);
      } else {
        deleteCookie("wacke_token");
        deleteCookie("wacke_refresh_token");
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de la session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Sync profile on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Expose a simple demo login for easy testing
  const demoLogin = async () => {
    return login("demo_user@mock.wacke.ca", "demo_user");
  };

  // ─── Login ──────────────────────────────────────────────────────────────
  const login = async (email: string, username?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseMocked()) {
        // Mock Login: always works for demo
        const finalUsername = (username || email.split("@")[0] || "visiteur").toLowerCase().replace(/[^a-z0-9_]/g, "");
        const mockSupabaseId = `mock-${finalUsername}-${Date.now()}`;
        // Dev-only: signed platform session (unsigned mock-session rejected in production)
        const { createPlatformSession } = await import("@/lib/platform-session");
        const mockToken = createPlatformSession({
          provider: "mock",
          username: finalUsername,
          supabaseId: mockSupabaseId.includes("-")
            ? mockSupabaseId
            : "12345678-1234-1234-1234-" +
              Array.from(finalUsername.slice(0, 6))
                .map((c) => c.charCodeAt(0).toString(16))
                .join("")
                .substring(0, 12)
                .padEnd(12, "0"),
        });
        
        // Sync profile
        const syncRes = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ username: finalUsername, displayName: finalUsername }),
        });

        if (!syncRes.ok) {
          const syncData = await syncRes.json();
          setIsLoading(false);
          return { success: false, error: syncData.error || "Erreur de synchro" };
        }

        const data = await syncRes.json();
        setToken(mockToken);
        setCookie("wacke_token", mockToken);
        setUser(data.user);
        setIsLoading(false);
        router.refresh();
        return { success: true };
      }

      // Real Supabase Auth: Send OTP (pure code flow)
      const supabase = getSupabaseClient();
      console.log("[AUTH_PROVIDER_SEND_OTP] project:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      const redirectTo = typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000/auth/callback"
        : "https://wacke.live/auth/callback";
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) {
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      setIsLoading(false);
      return { success: true, message: "Code envoyé par courriel!" };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Erreur inconnue" };
    }
  };

  // ─── Signup ─────────────────────────────────────────────────────────────
  const signup = async (username: string, displayName: string, email: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseMocked()) {
        // Mock Signup
        const validMockUuid = "12345678-1234-1234-1234-" + Array.from(username.slice(0, 6))
          .map((c) => c.charCodeAt(0).toString(16))
          .join("")
          .substring(0, 12)
          .padEnd(12, "0");

        const { createPlatformSession } = await import("@/lib/platform-session");
        const mockToken = createPlatformSession({
          provider: "mock",
          username,
          supabaseId: validMockUuid,
        });

        const syncRes = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ username, displayName }),
        });

        if (!syncRes.ok) {
          const syncData = await syncRes.json();
          setIsLoading(false);
          return { success: false, error: syncData.error || "Erreur de synchro" };
        }

        const data = await syncRes.json();
        setToken(mockToken);
        setCookie("wacke_token", mockToken);
        setUser(data.user);
        setIsLoading(false);
        router.refresh();
        return { success: true };
      }

      // Real Supabase Auth: standard email sign up
      // We will create the user via password signup or standard signup
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: "TempPassword123!", // Dummy password since magic link is preferred
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (authData.session) {
        const { access_token, refresh_token } = authData.session;
        const sessionToken = access_token;
        // Sync
        const syncRes = await fetch("/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ username, displayName }),
        });

        if (syncRes.ok) {
          const data = await syncRes.json();
          setToken(sessionToken);
          setCookie("wacke_token", sessionToken);
          if (refresh_token) {
            const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
            document.cookie = `wacke_refresh_token=${refresh_token}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
          }
          setUser(data.user);
        }
      }

      setIsLoading(false);
      return { success: true, message: "Compte créé! Valide tes courriels pour activer ta session." };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Erreur de création de compte" };
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────────────
  const logout = async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseMocked()) {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Erreur lors du déconnexion Supabase:", err);
    } finally {
      deleteCookie("wacke_token");
      setUser(null);
      setToken(null);
      setIsLoading(false);
      router.push("/");
      router.refresh();
    }
  };

  // ─── Claim Daily Tokens ──────────────────────────────────────────────────
  const claimDailyTokens = async () => {
    const activeToken = token || getCookie("wacke_token");
    if (!activeToken) return { success: false, error: "Connecte-toi pour réclamer tes tokens." };

    try {
      const res = await fetch("/api/tokens/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }

      // Update local state balance
      if (user) {
        setUser({ ...user, tokenBalance: data.newBalance });
      }

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: "Connexion perdue." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        signup,
        logout,
        claimDailyTokens,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
