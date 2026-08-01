"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import {
  useInvestorProfile,
  useUpdateInvestorProfile,
} from "@/hooks/queries/investor-profile";
import type { InvestorProfile } from "@/types/investor/profile";
import {
  draftFromProfile,
  draftToInput,
  type ThesisDraft,
} from "./_components/draft";
import ThesisWizard from "./_components/ThesisWizard";
import StepCheckSizeGeoStage from "./_components/StepCheckSizeGeoStage";
import StepSectorsEquityBoard from "./_components/StepSectorsEquityBoard";
import StepPhilosophy from "./_components/StepPhilosophy";
import ThesisCompletionCard from "./_components/ThesisCompletionCard";
import ThesisWizardSkeleton from "./_components/ThesisWizardSkeleton";

const TOTAL_STEPS = 4; // 3 input steps + completion

const STEP_META = [
  {
    title: "Return expectations & focus",
    subtitle: "Set your check size, geographies, and stages.",
  },
  {
    title: "Sectors, equity & governance",
    subtitle: "Where and how you invest.",
  },
  {
    title: "Investment philosophy",
    subtitle: "Your thesis, return target, and role.",
  },
];

export default function ThesisPage() {
  const { data: profile, isLoading, isError, refetch } = useInvestorProfile();
  const update = useUpdateInvestorProfile();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ThesisDraft | null>(null);
  const [savedProfile, setSavedProfile] = useState<InvestorProfile | null>(null);

  // Seed the wizard from the loaded profile exactly once.
  useEffect(() => {
    if (profile && draft === null) setDraft(draftFromProfile(profile));
  }, [profile, draft]);

  if (isLoading || draft === null) {
    return (
      <div className="w-full max-w-[880px] mx-auto pb-8">
        <ThesisWizardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-[880px] mx-auto space-y-4 pb-8">
        <ErrorState
          title="Couldn't load your investor profile"
          message="Your profile is needed to build your thesis. Check your connection and retry."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (savedProfile) {
    return (
      <div className="w-full max-w-[880px] mx-auto pb-8">
        <ThesisCompletionCard profile={savedProfile} />
      </div>
    );
  }

  const patch = (p: Partial<ThesisDraft>) =>
    setDraft((d) => ({ ...(d as ThesisDraft), ...p }));

  // Step 1 is the only step with a hard validation gate (check-size range).
  const rangeValid = !(draft.maxCheckSize > 0 && draft.minCheckSize > draft.maxCheckSize);
  const canProceed = step === 1 ? rangeValid : true;

  const onSubmit = () => {
    update.mutate(draftToInput(draft), {
      onSuccess: (data) => setSavedProfile(data),
    });
  };

  const meta = STEP_META[step - 1];

  return (
    <div className="w-full max-w-[880px] mx-auto pb-8">
      <ThesisWizard
        step={step}
        totalSteps={TOTAL_STEPS}
        title={meta.title}
        subtitle={meta.subtitle}
        canProceed={canProceed}
        isSaving={update.isPending}
        isError={update.isError}
        errorMessage={update.error?.message}
        onBack={() => setStep((s) => Math.max(1, s - 1))}
        onNext={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
        onSubmit={onSubmit}
      >
        {step === 1 ? <StepCheckSizeGeoStage draft={draft} update={patch} /> : null}
        {step === 2 ? <StepSectorsEquityBoard draft={draft} update={patch} /> : null}
        {step === 3 ? <StepPhilosophy draft={draft} update={patch} /> : null}
      </ThesisWizard>
    </div>
  );
}
