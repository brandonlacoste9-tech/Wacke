"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  streamerId: string;
  initialIsFollowing: boolean;
  authToken?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  streamerId,
  initialIsFollowing,
  authToken,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleFollow = async () => {
    if (!authToken) {
      setToastMsg("Connecte-toi pour suivre ce streamer!");
      setTimeout(() => setToastMsg(null), 3000);
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    setToastMsg(null);

    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ streamerId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMsg(data.error || "Erreur de connexion.");
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }

      setIsFollowing(data.following);
      setToastMsg(data.message);
      setTimeout(() => setToastMsg(null), 3000);

      if (onFollowChange) {
        onFollowChange(data.following);
      }
    } catch {
      setToastMsg("Connexion perdue. Réessaie.");
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`px-5 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
          isFollowing
            ? "bg-green-600/20 hover:bg-green-600/40 border border-green-500/40 text-green-400"
            : "bg-wacke-purple/20 hover:bg-wacke-purple/40 border border-wacke-purple/40 text-wacke-purple"
        }`}
      >
        <span>💜</span>
        <span>{isFollowing ? "ABONNÉ ✅" : "SUIVRE"}</span>
      </button>

      {toastMsg && (
        <div className="absolute right-0 top-12 z-50 bg-wacke-darker border border-wacke-purple/40 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xl neon-border whitespace-nowrap animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
