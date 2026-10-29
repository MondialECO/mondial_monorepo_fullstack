import type { ClarifierAnswer, ClarifierChatMessage } from "@/types/creator/journey-api";

// Mirrors backend ClarifierScript. Index 0 = question 1; the first key receives the raw answer as fallback.
export const CLARIFIER_FIELDS: readonly (readonly string[])[] = [
  ["problem"],
  ["targetUser"],
  ["existingAlternatives"],
  ["solution"],
  ["creatorEdge", "founderAdvantage"],
  ["whyNow", "riskiestAssumption"],
];

export const CLARIFIER_TOTAL_QUESTIONS = CLARIFIER_FIELDS.length;
export const CLARIFIER_MAX_ATTEMPTS = 5;

export const isAnswerDone = (a?: ClarifierAnswer) => a?.status === "accepted" || a?.status === "accepted_weak";

/** Stored records, or (legacy ideas) one accepted record per user message that predates per-question records. */
export function getClarifierAnswers(phase2?: {
  clarifierAnswers?: ClarifierAnswer[];
  chatMessages?: ClarifierChatMessage[];
}): ClarifierAnswer[] {
  if (phase2?.clarifierAnswers?.length) return phase2.clarifierAnswers;
  return (phase2?.chatMessages ?? [])
    .filter((m) => m.sender === "user" && m.questionIndex == null)
    .slice(0, CLARIFIER_TOTAL_QUESTIONS)
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

export function currentQuestionIndex(answers: ClarifierAnswer[]): number | null {
  for (let q = 1; q <= CLARIFIER_TOTAL_QUESTIONS; q++) {
    if (!isAnswerDone(answers.find((a) => a.questionIndex === q))) return q;
  }
  return null;
}

/** User edit, else AI extraction, else the raw answer. */
export function effectiveFields(answer: ClarifierAnswer): Record<string, string> {
  const keys = CLARIFIER_FIELDS[answer.questionIndex - 1] ?? [];
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = answer.userEdited?.[key]?.trim() || answer.aiExtracted?.[key]?.trim();
    if (value) result[key] = value;
  }
  const raw = answer.rawAnswer?.trim();
  if (Object.keys(result).length === 0 && raw) {
    // Question 6's raw text fills both whyNow and riskiestAssumption (backend parity).
    for (const key of keys) if (answer.questionIndex === 6 || key === keys[0]) result[key] = raw;
  }
  return result;
}

/** True when any answer changed after the last summary (or the summary predates timestamps). */
export function summaryIsStale(answers: ClarifierAnswer[], summarizedAt?: string | null): boolean {
  if (!summarizedAt) return true;
  const at = Date.parse(summarizedAt);
  return answers.some((a) => Date.parse(a.updatedAt) > at);
}

/** C-2 rawIdea built from the effective answer values. */
export function buildRawIdea(answers: ClarifierAnswer[], projectName: string | undefined, fallbackTitle: string) {
  const f: Record<string, string> = {};
  for (const a of answers) Object.assign(f, effectiveFields(a));
  return {
    title: projectName?.trim() || f.problem?.slice(0, 60) || fallbackTitle,
    problemStatement: f.problem ?? "",
    targetAudience: f.targetUser ?? "",
    description: f.solution ?? f.problem ?? "",
    existingAlternatives: f.existingAlternatives ?? "",
    // finalize-clarifier copies this verbatim onto project.creatorEdge, so keep both halves of question 5.
    founderAdvantage: [...new Set([f.creatorEdge, f.founderAdvantage].filter(Boolean))].join(" "),
    whyNow: f.whyNow ?? "",
    riskiestAssumption: f.riskiestAssumption ?? "",
  };
}
