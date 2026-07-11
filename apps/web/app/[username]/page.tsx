import { notFound, redirect } from "next/navigation";
import {
  getUserByUsername,
  getReservedUsername,
  getHoldHoursRemaining,
  isSystemBlockedUsername,
} from "@wacke/db";
import ClaimPage from "@/components/ClaimPage";
import type { Metadata } from "next";

const BLOCKED = new Set([
  "auth", "api", "browse", "stream", "profile", "dashboard", "settings",
  "build", "claims", "onboarding",
]);

interface PageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const username = params.username.toLowerCase();
  const reserved = getReservedUsername(username);
  const displayName = reserved?.displayName ?? username;

  return {
    title: `@${username} — Claim your channel | Wacké`,
    description: `${displayName}, your @${username} handle is reserved on Wacké. Claim it before someone else does.`,
    openGraph: {
      title: `@${username} is reserved on Wacké`,
      description: "Dark-glass UI + Grok roast engine. Claim your handle free.",
      images: [{ url: "/hero_banner.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function VanityClaimPage({ params }: PageProps) {
  const username = params.username.toLowerCase().trim();

  if (!/^[a-z0-9_]{3,32}$/.test(username)) notFound();
  if (BLOCKED.has(username) || isSystemBlockedUsername(username)) notFound();

  const existingUser = await getUserByUsername(username);
  const isRealUser =
    existingUser && !String(existingUser.id).startsWith("kick-mock-streamer-");

  if (isRealUser) {
    redirect(`/profile/${username}`);
  }

  const reserved = getReservedUsername(username);
  if (!reserved) notFound();

  const hoursRemaining = getHoldHoursRemaining(reserved);

  return (
    <ClaimPage
      username={username}
      reserved={reserved}
      hoursRemaining={hoursRemaining}
      isClaimed={reserved.status === "claimed"}
    />
  );
}