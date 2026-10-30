import type { ClarifierAnswer, ClarifierChatMessage } from "@/types/creator/journey-api";

// Mirrors backend ClarifierScript. Index 0 = topic 1; the first key receives the raw answer as fallback.
export const CLARIFIER_TOPIC_FIELDS: readonly (readonly string[])[] = [
  ["problem"],
  ["targetUser"],
  ["existingAlternatives"],
  ["solution"],
  ["creatorEdge", "founderAdvantage"],
  ["whyNow", "riskiestAssumption"],
];

export const CLARIFIER_TOTAL_TOPICS = CLARIFIER_TOPIC_FIELDS.length;

/** Order topics are asked in (and shown in the panel): problem → who → solution → alternatives → edge → why now/risk. */
export const CLARIFIER_ASK_ORDER: readonly number[] = [1, 2, 4, 3, 5, 6];

export type TopicState = "empty" | "unclear" | "weak" | "clear";

export function topicState(a?: ClarifierAnswer): TopicState {
  if (!a) return "empty";
  if (a.status === "accepted") return "clear";
  if (a.status === "accepted_weak") return "weak";
  return "unclear";
}

/** Clear or weak — the flow has moved past it. */
export const isTopicDone = (a?: ClarifierAnswer) => {
  const s = topicState(a);
  return s === "clear" || s === "weak";
};

/** Stored records, or (legacy ideas) one accepted record per user message that predates per-topic records. */
export function getClarifierAnswers(phase2?: {
  clarifierAnswers?: ClarifierAnswer[];
  chatMessages?: ClarifierChatMessage[];
}): ClarifierAnswer[] {
  if (phase2?.clarifierAnswers?.length) return phase2.clarifierAnswers;
  return (phase2?.chatMessages ?? [])
    .filter((m) => m.sender === "user" && m.questionIndex == null)
    .slice(0, CLARIFIER_TOTAL_TOPICS)
    .map((m, i) => ({
      questionIndex: i + 1,
      status: "accepted" as const,
      attempts: 1,
      rawAnswer: m.text,
      aiExtracted: {},
      userEdited: null,
      language: null,
      updatedAt: m.timestamp ?? "",
    }));
}

/**
 * Topics whose live status is weak. The single source for every "unconfirmed" marker in the UI —
 * an edit that makes a topic clear removes its marker everywhere with no extra sync.
 */
export function weakTopics(answers: ClarifierAnswer[] | undefined): number[] {
  return (answers ?? []).filter((a) => topicState(a) === "weak").map((a) => a.questionIndex);
}

/** The topic being asked: first in ask order that is empty or unclear; null when all are done. */
export function nextTopic(answers: ClarifierAnswer[]): number | null {
  for (const t of CLARIFIER_ASK_ORDER) {
    if (!isTopicDone(answers.find((a) => a.questionIndex === t))) return t;
  }
  return null;
}

/** User edit, else AI extraction, else the raw answer. */
export function effectiveFields(answer: ClarifierAnswer): Record<string, string> {
  const keys = CLARIFIER_TOPIC_FIELDS[answer.questionIndex - 1] ?? [];
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = answer.userEdited?.[key]?.trim() || answer.aiExtracted?.[key]?.trim();
    if (value) result[key] = value;
  }
  const raw = answer.rawAnswer?.trim();
  if (Object.keys(result).length === 0 && raw) {
    // Topic 6's raw text fills both whyNow and riskiestAssumption (backend parity).
    for (const key of keys) if (answer.questionIndex === 6 || key === keys[0]) result[key] = raw;
  }
  return result;
}

/**
 * Text to pre-fill when re-writing one topic: that topic's own field text (both parts joined for
 * two-field topics). The raw answer can be the whole multi-topic opener, so it is only the fallback.
 */
export function editableText(answer: ClarifierAnswer): string {
  const parts = [...new Set(Object.values(effectiveFields(answer)).map((v) => v.trim()).filter(Boolean))];
  return parts.length > 0 ? parts.join("\n") : answer.rawAnswer;
}

/** True when any answer changed after the last summary (or the summary predates timestamps). */
export function summaryIsStale(answers: ClarifierAnswer[], summarizedAt?: string | null): boolean {
  if (!summarizedAt) return true;
  const at = Date.parse(summarizedAt);
  return answers.some((a) => Date.parse(a.updatedAt) > at);
}

// C-2 raw-idea keys each topic feeds.
const RAW_KEYS_BY_TOPIC: Record<number, string[]> = {
  1: ["problemStatement"],
  2: ["targetAudience"],
  3: ["existingAlternatives"],
  4: ["description"],
  5: ["founderAdvantage"],
  6: ["whyNow", "riskiestAssumption"],
};

/** C-2 rawIdea built from the effective answer values. Weak topics are flagged so C-2 and Phase 3 never treat them as confirmed. */
export function buildRawIdea(answers: ClarifierAnswer[], projectName: string | undefined, fallbackTitle: string) {
  const f: Record<string, string> = {};
  for (const a of answers) Object.assign(f, effectiveFields(a));
  const unconfirmedFields = answers
    .filter((a) => topicState(a) === "weak")
    .flatMap((a) => RAW_KEYS_BY_TOPIC[a.questionIndex] ?? []);
  return {
    title: projectName?.trim() || f.problem?.slice(0, 60) || fallbackTitle,
    problemStatement: f.problem ?? "",
    targetAudience: f.targetUser ?? "",
    description: f.solution ?? f.problem ?? "",
    existingAlternatives: f.existingAlternatives ?? "",
    // finalize-clarifier copies this verbatim onto project.creatorEdge, so keep both halves of topic 5.
    founderAdvantage: [...new Set([f.creatorEdge, f.founderAdvantage].filter(Boolean))].join(" "),
    whyNow: f.whyNow ?? "",
    riskiestAssumption: f.riskiestAssumption ?? "",
    unconfirmedFields,
  };
}
