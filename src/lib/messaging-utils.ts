import { UserRole } from "@/lib/roles";
import type { ConversationParticipant } from "@/types/chat";

// Within the Entrepreneur↔Investor loop the counterparty is, by definition,
// the opposite role of the current user — used as a fallback label when the
// participant's real name is unavailable.
export function counterpartyRoleLabel(currentRole: UserRole | undefined): string {
  if (currentRole === UserRole.INVESTOR) return "Entrepreneur";
  if (currentRole === UserRole.ENTREPRENEUR) return "Investor";
  return "Participant";
}

// The other participant of a direct conversation (not the current user).
export function otherParticipant(
  participants: ConversationParticipant[],
  currentUserId: string | undefined
): ConversationParticipant | undefined {
  if (!currentUserId) return participants[0];
  return participants.find((p) => p.id !== currentUserId) ?? participants[0];
}

// Real name when known, else a role-based fallback ("Investor · 3F2A").
export function participantDisplayName(
  participant: ConversationParticipant | undefined,
  currentRole: UserRole | undefined
): string {
  const name = participant?.name?.trim();
  if (name) return name;
  return `${counterpartyRoleLabel(currentRole)} · ${shortId(participant?.id)}`;
}

// Resolve a possibly-relative ImagePath to an absolute URL against the API
// origin (NEXT_PUBLIC_API_BASE_URL minus the trailing /api).
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5093/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}/${path.replace(/^\/+/, "")}`;
}

// Short, stable suffix to disambiguate same-role counterparties in a list.
export function shortId(id: string | undefined): string {
  if (!id) return "";
  return id.replace(/-/g, "").slice(0, 4).toUpperCase();
}

export function initialsFromLabel(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Compact, locale-aware relative timestamp for list rows / bubbles.
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatClockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
