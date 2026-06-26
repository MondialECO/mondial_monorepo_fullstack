import type { GeneratedIdea } from "@/types/creator/ai";

/**
 * The card/canvas shape the Phase-2 Discovery UI renders. The backend
 * IdeaGenerator returns only the 5 substantive fields ({@link GeneratedIdea});
 * the remaining display fields (category/tam/saturation/similarTo) are not
 * produced server-side, so they map to "—" rather than fabricated values.
 */
export interface UiConcept {
  id: string;
  title: string;
  category: string;
  description: string;
  score: number;
  tam: string;
  saturation: string;
  similarTo: string;
  concept: string;
  targetUser: string;
  coreProblem: string;
  solution: string;
  marketGap: string;
  founderEdge: string;
}

const NA = "—";

/** Map the AI-generated ideas onto the existing UI concept shape (no UI change). */
export function mapGeneratedIdeas(
  ideas: GeneratedIdea[],
  sectors: string[] = [],
): UiConcept[] {
  return ideas.map((idea, i) => ({
    id: `concept-${i + 1}`,
    title: idea.title,
    category: sectors[i] || sectors[0] || "Venture",
    description: idea.solution,
    score: Math.round(idea.score ?? 0),
    tam: idea.tam?.trim() || NA,
    saturation: idea.saturation?.trim() || NA,
    similarTo: idea.similarTo?.trim() || NA,
    concept: idea.solution,
    targetUser: idea.targetUser?.trim() || "",
    coreProblem: idea.problem,
    solution: idea.solution,
    marketGap: idea.marketGap,
    founderEdge: idea.founderEdge?.trim() || "",
  }));
}
