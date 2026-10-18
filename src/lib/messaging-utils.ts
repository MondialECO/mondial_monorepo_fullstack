import { UserRole } from "@/lib/roles";
import { API_ORIGIN } from "@/lib/api-config";
import type { ConversationParticipant } from "@/types/chat";

// Within the Entrepreneur↔Investor loop the counterparty is, by definition,
// the opposite role of the current user — used as a fallback label when the
// participant's real name is unavailable.
export function counterpartyRoleLabel(
  currentRole: UserRole | undefined,
  locale?: string
): string {
  const isFr = locale === "fr";
  if (currentRole === UserRole.INVESTOR) return isFr ? "Entrepreneur" : "Entrepreneur";
  if (currentRole === UserRole.ENTREPRENEUR) return isFr ? "Investisseur" : "Investor";
  return isFr ? "Participant" : "Participant";
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
  currentRole: UserRole | undefined,
  locale?: string
): string {
  const name = participant?.name?.trim();
  if (name) return name;
  return `${counterpartyRoleLabel(currentRole, locale)} · ${shortId(participant?.id)}`;
}

// Resolve a possibly-relative ImagePath to an absolute URL against the API
// origin (API_ORIGIN = NEXT_PUBLIC_API_BASE_URL minus the trailing /api).
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
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
export function formatRelativeTime(iso: string | null, locale?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60_000);
  const isFr = locale === "fr";
  if (min < 1) return isFr ? "à l'instant" : "now";
  if (min < 60) return isFr ? `${min} min` : `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return isFr ? `${hr} h` : `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return isFr ? `${day} j` : `${day}d`;
  return new Date(iso).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatClockTime(iso: string, locale?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const isFr = locale === "fr";
  return d.toLocaleTimeString(isFr ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
