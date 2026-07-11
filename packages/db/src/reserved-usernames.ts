export type ReservedStatus = "reserved" | "claimed" | "held";

export interface ReservedUsername {
  username: string;
  displayName: string;
  heldSince: string;
  holdDays: number;
  status: ReservedStatus;
  platform?: string;
}

/** Streamers contacted via recruitment DMs — handles held for claim. */
export const RESERVED_USERNAMES: ReservedUsername[] = [
  { username: "yonnajay", displayName: "Yonna Jay", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "lacari", displayName: "Lacari", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "mernuel", displayName: "Mernuel", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "rakai", displayName: "RaKai", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "rdjavi", displayName: "rdJavi", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "kingsman265", displayName: "Kingsman265", heldSince: "2026-07-06", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "jidion", displayName: "JiDion", heldSince: "2026-07-07", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "clavicular", displayName: "Clavicular", heldSince: "2026-07-07", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "ninadaddyisback", displayName: "Nina Lin", heldSince: "2026-07-07", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "ilikehaskell", displayName: "Haskell", heldSince: "2026-07-07", holdDays: 14, status: "reserved", platform: "Kick" },
  { username: "stomperirl", displayName: "StomperIRL", heldSince: "2026-07-07", holdDays: 14, status: "held", platform: "Kick" },
  { username: "cocottee", displayName: "Cocotte", heldSince: "2026-07-09", holdDays: 14, status: "reserved", platform: "Twitch" },
  { username: "elijah", displayName: "Elijah Des", heldSince: "2026-07-09", holdDays: 14, status: "reserved", platform: "Twitch" },
  { username: "lewislefou", displayName: "Lewis le Fou", heldSince: "2026-07-09", holdDays: 14, status: "reserved", platform: "Twitch" },
];

const RESERVED_MAP = new Map(
  RESERVED_USERNAMES.map((r) => [r.username.toLowerCase(), r])
);

const SYSTEM_BLOCKED = new Set([
  "admin", "wacke", "grok", "moderator", "api", "auth", "browse", "stream",
  "profile", "dashboard", "settings", "build", "claims", "onboarding",
]);

export function getReservedUsername(username: string): ReservedUsername | null {
  return RESERVED_MAP.get(username.toLowerCase().trim()) ?? null;
}

export function isSystemBlockedUsername(username: string): boolean {
  return SYSTEM_BLOCKED.has(username.toLowerCase().trim());
}

export function getHoldExpiresAt(reserved: ReservedUsername): Date {
  const start = new Date(reserved.heldSince);
  return new Date(start.getTime() + reserved.holdDays * 24 * 60 * 60 * 1000);
}

export function getHoldHoursRemaining(reserved: ReservedUsername): number {
  const expires = getHoldExpiresAt(reserved);
  return Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (60 * 60 * 1000)));
}

export function getActiveReservedUsernames(): ReservedUsername[] {
  return RESERVED_USERNAMES.filter((r) => r.status === "reserved");
}