"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { creatorJourneyApi, type OwnershipEntry, type UseOfFunds } from "@/lib/api-creator-journey";
import { CompanyPlanningCard } from "@/components/company-formation/CompanyPlanningCard";
import { FundingPreparationCard } from "@/components/company-formation/FundingPreparationCard";

type BuildState = {
  companyFormation?: { selectedType?: string; ownership?: OwnershipEntry[] } | null;
  seedFunding?: { totalAsk?: number; useOfFunds?: UseOfFunds[]; investorTypesTargeted?: string[] } | null;
};

type FormationContext = {
  selectedType?: string;
  youNeed?: Array<{ skill?: string }>;
  cofounderDraft?: { roleNeeded?: string; equityRange?: string; locationPreference?: string } | null;
};

export function CrossroadsPathB({
  ideaId,
  initial,
  formationContext,
  onChanged,
}: {
  ideaId: string | null;
  initial?: Record<string, unknown>;
  formationContext?: Record<string, unknown>;
  onChanged: () => void;
}) {
  const saved = initial as BuildState | undefined;
  const formation = formationContext as FormationContext | undefined;
  const [type, setType] = useState(saved?.companyFormation?.selectedType ?? formation?.selectedType ?? "");
  const [ownership, setOwnership] = useState<OwnershipEntry[]>(
    saved?.companyFormation?.ownership?.length
      ? saved.companyFormation.ownership
      : [{ holder: "", percent: 0, isFounder: true, isEsop: false }]
  );
  const [formSaved, setFormSaved] = useState(Boolean(saved?.companyFormation));
  const [formWarn, setFormWarn] = useState<string[]>([]);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  const [totalAsk, setTotalAsk] = useState(saved?.seedFunding?.totalAsk ?? 0);
  const [use, setUse] = useState<UseOfFunds[]>(saved?.seedFunding?.useOfFunds ?? []);
  const [investorTypes, setInvestorTypes] = useState<string[]>(saved?.seedFunding?.investorTypesTargeted ?? []);
  const [seedSaved, setSeedSaved] = useState(Boolean(saved?.seedFunding));
  const [seedErr, setSeedErr] = useState<string | null>(null);
  const [savingSeed, setSavingSeed] = useState(false);

  const saveFormation = async () => {
    setSavingForm(true);
    setFormErr(null);
    try {
      const res = await creatorJourneyApi.companyFormation({ selectedType: type, ownership }, ideaId);
      setFormWarn(res.warnings);
      setFormSaved(true);
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save company planning."));
    } finally {
      setSavingForm(false);
    }
  };

  const saveSeed = async () => {
    setSavingSeed(true);
    setSeedErr(null);
    try {
      await creatorJourneyApi.seedFunding({ totalAsk, useOfFunds: use, investorTypesTargeted: investorTypes }, ideaId);
      setSeedSaved(true);
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setSeedErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save funding preparation."));
    } finally {
      setSavingSeed(false);
    }
  };

  return (
    <div className="space-y-4">
      {formation && (
        <Card className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="text-sm font-bold">Formation context</div>
          <p className="text-xs text-muted-foreground">Phase 3 company/team decisions are reused here; they are not recreated.</p>
          {formation.cofounderDraft && (
            <p className="text-xs">
              Co-founder opportunity: {formation.cofounderDraft.roleNeeded ?? "Not specified"} · {formation.cofounderDraft.equityRange ?? "Equity to be decided"} · {formation.cofounderDraft.locationPreference ?? "Location flexible"}
            </p>
          )}
          {formation.youNeed?.length ? (
            <p className="text-xs text-muted-foreground">
              Team gaps: {formation.youNeed.map((item) => item.skill).filter(Boolean).join(", ")}
            </p>
          ) : null}
        </Card>
      )}

      <CompanyPlanningCard
        type={type}
        onTypeChange={setType}
        ownership={ownership}
        onOwnershipChange={setOwnership}
        onSave={saveFormation}
        isSaving={savingForm}
        isSaved={formSaved}
        error={formErr}
        warnings={formWarn}
      />

      <FundingPreparationCard
        totalAsk={totalAsk}
        onTotalAskChange={setTotalAsk}
        useOfFunds={use}
        onUseOfFundsChange={setUse}
        investorTypes={investorTypes}
        onInvestorTypesChange={setInvestorTypes}
        onSave={saveSeed}
        isSaving={savingSeed}
        isSaved={seedSaved}
        error={seedErr}
      />
    </div>
  );
}
