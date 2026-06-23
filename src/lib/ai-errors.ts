import { AxiosError } from "axios";

/**
 * The distinct failure modes an AI start/debit request can return. The backend
 * disambiguates these (see PART 3 of the AI config gate):
 *   - `credits` (402): the creator's OWN AI credit balance is exhausted →
 *     show an upgrade / contact CTA, not a retry.
 *   - `service` (503): an upstream AI-provider/billing issue on our side →
 *     transient, show a retry affordance, never an "upgrade" prompt.
 *   - `rateLimited` (429): too many AI requests in the window → wait + retry.
 *   - `other`: anything else → generic message.
 */
export type AiErrorKind = "credits" | "service" | "rateLimited" | "other";

export interface AiError {
  status?: number;
  kind: AiErrorKind;
  /** User-facing message tailored to the kind. */
  message: string;
}

/** Pull the HTTP status off an axios error (or a plain `{ status }`-shaped one). */
function statusOf(e: unknown): number | undefined {
  const axiosStatus = (e as AxiosError)?.response?.status;
  if (typeof axiosStatus === "number") return axiosStatus;
  const plain = (e as { status?: number })?.status;
  return typeof plain === "number" ? plain : undefined;
}

/**
 * Maps an AI request error to a user-facing {@link AiError}. 402 and 503 are
 * intentionally different situations and must read differently to the user —
 * a creator whose credits ran out needs to upgrade, while a provider outage is
 * temporary and should be retried.
 */
export function toAiError(
  e: unknown,
  fallback = "Something went wrong. Please try again.",
): AiError {
  const status = statusOf(e);
  const serverMessage = (e as AxiosError<{ message?: string }>)?.response?.data
    ?.message;

  switch (status) {
    case 402:
      return {
        status,
        kind: "credits",
        message: "You've used all your AI credits.",
      };
    case 503:
      return {
        status,
        kind: "service",
        message:
          "AI service temporarily unavailable — please try again shortly.",
      };
    case 429:
      return {
        status,
        kind: "rateLimited",
        message: "You're going a bit fast — please wait a moment and try again.",
      };
    default:
      return {
        status,
        kind: "other",
        message: serverMessage || (e instanceof Error ? e.message : fallback),
      };
  }
}
