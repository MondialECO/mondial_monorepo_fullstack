import type { InvestorProfile, InvestorThesisInput } from "@/types/investor/profile";

// Local wizard state. Mirrors the editable thesis fields; nulls are normalised
// to empty so inputs stay controlled.
export interface ThesisDraft {
  minCheckSize: number;
  maxCheckSize: number;
  preferredGeographies: string[];
  preferredStages: string[];
  preferredSectors: string[];
  preferredEquityTypes: string[];
  boardParticipationLevel: string | null;
  requiresProRataRights: boolean;
  requiresBoardSeat: boolean;
  thesisStatement: string;
  targetReturnMultiple: string | null;
  followOnPolicy: string | null;
  preferredRole: string | null;
}

export function draftFromProfile(p?: InvestorProfile | null): ThesisDraft {
  return {
    minCheckSize: p?.minCheckSize ?? 0,
    maxCheckSize: p?.maxCheckSize ?? 0,
    preferredGeographies: p?.preferredGeographies ?? [],
    preferredStages: p?.preferredStages ?? [],
    preferredSectors: p?.preferredSectors ?? [],
    preferredEquityTypes: p?.preferredEquityTypes ?? [],
    boardParticipationLevel: p?.boardParticipationLevel ?? null,
    requiresProRataRights: p?.requiresProRataRights ?? false,
    requiresBoardSeat: p?.requiresBoardSeat ?? false,
    thesisStatement: p?.thesisStatement ?? "",
    targetReturnMultiple: p?.targetReturnMultiple ?? null,
    followOnPolicy: p?.followOnPolicy ?? null,
    preferredRole: p?.preferredRole ?? null,
  };
}

export function draftToInput(d: ThesisDraft): InvestorThesisInput {
  return {
    minCheckSize: d.minCheckSize,
    maxCheckSize: d.maxCheckSize,
    preferredGeographies: d.preferredGeographies,
    preferredStages: d.preferredStages,
    preferredSectors: d.preferredSectors,
    preferredEquityTypes: d.preferredEquityTypes,
    boardParticipationLevel: d.boardParticipationLevel ?? undefined,
    requiresProRataRights: d.requiresProRataRights,
    requiresBoardSeat: d.requiresBoardSeat,
    thesisStatement: d.thesisStatement.trim(),
    targetReturnMultiple: d.targetReturnMultiple ?? undefined,
    followOnPolicy: d.followOnPolicy ?? undefined,
    preferredRole: d.preferredRole ?? undefined,
  };
}

/** Immutable toggle for a string in an array field. */
export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
