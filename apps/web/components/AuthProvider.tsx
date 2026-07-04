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
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function getRefreshCookie(): string | null {
  return getCookie("wacke_refresh_token");
}

function setCookie(name: string, val: string, days = 7) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const secureFlag = process.env.NODE_ENV === "production" ? ";secure" : "";
  document.cookie = `${name}=${val};path=/;expires=${date.toUTCString()};SameSite=Lax${secureFlag}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Lax`;
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

    try {
      let res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        // Try to refresh the token using Supabase client if we have refresh token
        const refreshTok = getRefreshCookie();
        if (refreshTok) {
          const supabase = getSupabaseClient();
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshTok,
          });

          if (!refreshError && refreshData.session) {
            const newAccess = refreshData.session.access_token;
            const newRefresh = refreshData.session.refresh_token;

            // Update cookies
            const secureFlag = process.env.NODE_ENV === "production" ? ";secure" : "";
            document.cookie = `wacke_token=${newAccess};path=/;max-age=604800;SameSite=Lax${secureFlag}`;
            if (newRefresh) {
              document.cookie = `wacke_refresh_token=${newRefresh};path=/;max-age=604800;SameSite=Lax${secureFlag}`;
            }

            activeToken = newAccess;
            setToken(activeToken);

            // Retry sync with new token
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

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(activeToken);
        setCookie("wacke_token", activeToken); // Refresh expiry
      } else {
        // Token might be expired, clear it
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

  // ─── Login ──────────────────────────────────────────────────────────────
  const login = async (email: string, username?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseMocked()) {
        // Mock Login: generate token based on username or email prefix
        const finalUsername = username || email.split("@")[0] || "visiteur";
        // Generate a persistent mock UUID for the user
        let mockUuid = "00000000-0000-0000-0000-" + Array.from(finalUsername)
          .map((c) => c.charCodeAt(0).toString(16))
          .join("")
          .padEnd(12, "0")
          .substring(0, 12);
        
        // Ensure UUID is valid format (sometimes padded hex string)
        if (mockUuid.length < 36) {
          mockUuid = "mock-uuid-user-" + finalUsername;
          // Wait, Drizzle schema.ts defines supabaseId as uuid.
          // In Postgres, a UUID column must receive a valid 36-char UUID.
          // Let's generate a valid UUID format (8-4-4-4-12 hex chars).
        }
        
        // Safe mock UUID helper
        const validMockUuid = "12345678-1234-1234-1234-" + Array.from(finalUsername.slice(0, 6))
          .map((c) => c.charCodeAt(0).toString(16))
          .join("")
          .substring(0, 12)
          .padEnd(12, "0");

        const mockToken = `mock-session:${finalUsername}:${validMockUuid}`;
        
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

      // Real Supabase Auth: Send OTP or magic link (or standard login)
      // For testing convenience, we'll request magic link login
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      setIsLoading(false);
      return { success: true, message: "Lien de connexion envoyé par courriel!" };
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

        const mockToken = `mock-session:${username}:${validMockUuid}`;

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
            const secureFlag = process.env.NODE_ENV === "production" ? ";secure" : "";
            document.cookie = `wacke_refresh_token=${refresh_token};path=/;max-age=604800;SameSite=Lax${secureFlag}`;
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
