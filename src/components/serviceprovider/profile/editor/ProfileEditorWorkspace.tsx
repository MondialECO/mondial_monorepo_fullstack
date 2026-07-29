"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SpCard,
  SpMutationFeedback,
  SpPage,
  SpStatusBadge,
} from "@/components/serviceprovider/ui";
import { useSpDirtyFormGuard } from "@/hooks/useSpDirtyFormGuard";
import {
  useProfileEditorDraft,
  useSaveProfileDraft,
  useServiceProviderProfile,
  useServiceProviderTrust,
  useSubmitProfileEditor,
} from "@/hooks/queries/service-provider";
import {
  draftModelFromResponse,
  draftRequestFromModel,
  validateAll,
  validateStep,
  type EditorDraftModel,
  type FieldError,
} from "@/lib/service-provider/profile-editor";
import {
  editorHref,
  focusElementId,
  isValidFocus,
  LAST_STEP,
  normalizeStep,
  PROFILE_EDITOR_STEPS,
  PROFILE_VIEW_ROUTE,
  type ProfileEditorStep,
} from "@/lib/service-provider/profile-navigation";
import type { ProfileEditorOutcome, ServiceProviderProfile } from "@/types/service-provider";
import { EditorResult } from "./EditorResult";
import { EditorStepIndicator, EditorValidationSummary } from "./EditorStepIndicator";
import { StepCredentials } from "./StepCredentials";
import { StepExperienceEducation } from "./StepExperienceEducation";
import { StepIdentityOverview } from "./StepIdentityOverview";
import { StepSkillsLanguages } from "./StepSkillsLanguages";

type SubmitResult = {
  outcome: ProfileEditorOutcome;
  profile: ServiceProviderProfile;
  credentialsPendingReview: number;
};

/**
 * The four-step Profile Editor. Step state lives in the URL so refresh, Back and
 * Forward all work. Step saves write only the server draft; nothing publishes
 * until the final submit, which the backend applies atomically across the three
 * split collections.
 */
export function ProfileEditorWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const step = normalizeStep(searchParams.get("step"));
  const focusParam = searchParams.get("focus");
  const showingResult = searchParams.get("state") === "result";

  const profileQuery = useServiceProviderProfile();
  const draftQuery = useProfileEditorDraft();
  const trustQuery = useServiceProviderTrust();
  const saveDraft = useSaveProfileDraft();
  const submitEditor = useSubmitProfileEditor();

  const [model, setModel] = useState<EditorDraftModel | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [furthest, setFurthest] = useState<ProfileEditorStep>(step);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  // Hydrate once from the server response. Later background refetches must never
  // overwrite in-progress local edits.
  useEffect(() => {
    if (hydratedRef.current || !draftQuery.data) return;
    hydratedRef.current = true;
    setModel(draftModelFromResponse(draftQuery.data, step));
    setFurthest(normalizeStep(Math.max(step, draftQuery.data.lastStep)));
  }, [draftQuery.data, step]);

  const dirtyGuard = useSpDirtyFormGuard(model, { enabled: !!model && !result });
  const { markClean } = dirtyGuard;

  // Focus the step heading on every step change so keyboard users land in place.
  useEffect(() => {
    if (!model || showingResult) return;
    headingRef.current?.focus();
  }, [step, model, showingResult]);

  // A section-level Edit action can request a specific field.
  useEffect(() => {
    if (!model || !isValidFocus(focusParam)) return;
    const target = document.getElementById(focusElementId(focusParam));
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    (target as HTMLElement).focus?.();
  }, [focusParam, model, step]);

  const goToStep = (next: ProfileEditorStep) => {
    setFurthest((current) => (next > current ? next : current));
    router.push(editorHref({ step: next }));
  };

  const patch = (changes: Partial<EditorDraftModel>) =>
    setModel((current) => (current ? { ...current, ...changes } : current));

  const focusField = (field: string) => {
    const element =
      document.getElementById(field) ?? document.getElementById(focusElementId(field as never));
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    (element as HTMLElement | null)?.focus?.();
  };

  const showErrors = (found: FieldError[]) => {
    setErrors(found);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  /** Validates the current step, persists the draft, then advances. */
  async function saveAndAdvance(next: ProfileEditorStep) {
    if (!model) return;
    const found = validateStep(step, model);
    if (found.length > 0) {
      showErrors(found);
      return;
    }

    setErrors([]);
    setFeedback(null);
    const nextModel = { ...model, lastStep: next };

    try {
      await saveDraft.mutateAsync(draftRequestFromModel(nextModel));
      // Only mark clean once the server confirmed the save.
      markClean(nextModel);
      setModel(nextModel);
      goToStep(next);
    } catch {
      setFeedback({
        status: "error",
        message: "Your changes could not be saved. They are still here — try again.",
      });
    }
  }

  async function submit() {
    if (!model || submitEditor.isPending) return;

    const found = validateAll(model);
    if (found.length > 0) {
      showErrors(found);
      const firstStep = found[0].step;
      if (firstStep !== step) goToStep(firstStep);
      return;
    }

    setErrors([]);
    setFeedback(null);
    setConflict(false);

    try {
      const response = await submitEditor.mutateAsync({
        basedOnVersion: model.basedOnVersion,
        draft: draftRequestFromModel({ ...model, lastStep: LAST_STEP }),
      });
      markClean(model);
      setResult(response);
      router.push(editorHref({ result: true }));
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // Stale version: keep the local draft and let the provider choose.
        setConflict(true);
        return;
      }
      setFeedback({
        status: "error",
        message:
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Your profile could not be submitted. Your draft has been kept — try again.",
      });
    }
  }

  if (profileQuery.isLoading || draftQuery.isLoading || !model) {
    return (
      <SpPage className="pb-4">
        <div className="mx-auto w-full max-w-3xl space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Loading profile editor</span>
          <div className="h-10 animate-pulse rounded-lg bg-[#EDEFF3]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#EDEFF3]" />
        </div>
      </SpPage>
    );
  }

  if (profileQuery.isError || draftQuery.isError) {
    return (
      <SpPage className="pb-4">
        <SpCard className="mx-auto max-w-3xl">
          <SpMutationFeedback status="error">
            The profile editor could not be loaded. Check your connection and try again.
          </SpMutationFeedback>
          <div className="mt-4">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => draftQuery.refetch()}>
              Retry
            </Button>
          </div>
        </SpCard>
      </SpPage>
    );
  }

  if (showingResult && result) {
    return (
      <SpPage className="pb-4">
        <EditorResult
          outcome={result.outcome}
          profile={result.profile}
          credentialsPendingReview={result.credentialsPendingReview}
          tierLevel={trustQuery.data?.tierLevel}
        />
      </SpPage>
    );
  }

  const profile = profileQuery.data!;
  const stepMeta = PROFILE_EDITOR_STEPS[step - 1];
  const savedDraft = draftQuery.data?.hasDraft;

  return (
    <SpPage className="pb-4">
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="min-h-11 -ml-2">
            <Link href={PROFILE_VIEW_ROUTE}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to profile
            </Link>
          </Button>
          {saveDraft.isPending && (
            <span className="flex items-center gap-2 text-sm text-[#6B7280]" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </span>
          )}
        </div>

        <EditorStepIndicator current={step} furthest={furthest} onSelect={goToStep} />

        {savedDraft && (
          <SpMutationFeedback status="info">
            We restored your saved draft. Nothing is published until you submit.
          </SpMutationFeedback>
        )}

        {conflict && (
          <SpCard className="border-[#FDA29B] bg-[#FEF3F2]">
            <h2 className="text-sm font-semibold text-[#B42318]">
              Your profile was updated in another session.
            </h2>
            <p className="mt-1 text-sm text-[#4B5563]">
              Submitting now would overwrite newer changes. Review the latest published profile, or
              keep editing your current draft.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="min-h-11">
                <Link href={PROFILE_VIEW_ROUTE}>Review latest profile</Link>
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setConflict(false)}>
                Keep my current draft
              </Button>
            </div>
          </SpCard>
        )}

        <div ref={summaryRef} tabIndex={-1} className="outline-none">
          <EditorValidationSummary
            errors={errors.map(({ field, message }) => ({ field, message }))}
            onFocusField={focusField}
          />
        </div>

        {feedback && (
          <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>
        )}

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-xl font-semibold text-[#171717] outline-none"
        >
          {stepMeta.heading}
        </h1>

        {step === 1 && (
          <StepIdentityOverview profile={profile} model={model} errors={errors} onChange={patch} />
        )}
        {step === 2 && (
          <StepExperienceEducation model={model} errors={errors} onChange={patch} />
        )}
        {step === 3 && <StepSkillsLanguages model={model} errors={errors} onChange={patch} />}
        {step === 4 && <StepCredentials credentials={profile.credentials ?? []} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-5">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => goToStep(normalizeStep(step - 1))}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 text-[#6B7280]"
                onClick={() => saveAndAdvance(3)}
              >
                Skip optional fields
              </Button>
            )}
          </div>

          {step < LAST_STEP ? (
            <Button
              type="button"
              className="min-h-11"
              disabled={saveDraft.isPending}
              onClick={() => saveAndAdvance(normalizeStep(step + 1))}
            >
              Next step
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11"
              disabled={submitEditor.isPending}
              onClick={submit}
            >
              {submitEditor.isPending ? "Submitting…" : "Submit Profile"}
            </Button>
          )}
        </div>

        {step === LAST_STEP && (
          <p className="text-center text-xs text-[#6B7280]">
            Submitting publishes your profile and sends any new credentials for review. Your tier and
            verification status are decided by Mondial.eco.
          </p>
        )}

        <p className="sr-only" aria-live="polite">
          {submitEditor.isPending ? "Submitting your profile" : ""}
        </p>
        <SpStatusBadge tone="neutral" className="sr-only">
          {`Step ${step} of ${PROFILE_EDITOR_STEPS.length}`}
        </SpStatusBadge>
      </div>
    </SpPage>
  );
}
