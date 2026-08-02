"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROFILE_EDITOR_STEPS, type ProfileEditorStep } from "@/lib/service-provider/profile-navigation";

/**
 * Accessible four-step progress. State is carried by text (`Completed` /
 * `Current step` / `Not started`) and an icon, never by colour alone.
 */
export function EditorStepIndicator({
  current,
  furthest,
  onSelect,
}: {
  current: ProfileEditorStep;
  /** Highest step reached, so completed steps stay navigable. */
  furthest: ProfileEditorStep;
  onSelect: (step: ProfileEditorStep) => void;
}) {
  return (
    <nav aria-label="Profile editor progress">
      <ol className="flex flex-wrap items-center justify-center gap-x-1 gap-y-3 sm:flex-nowrap">
        {PROFILE_EDITOR_STEPS.map((entry, index) => {
          const step = entry.step as ProfileEditorStep;
          const isCurrent = step === current;
          const isComplete = step < furthest || (step < current && step <= furthest);
          const reachable = step <= furthest;
          const state = isCurrent ? "Current step" : isComplete ? "Completed" : "Not started";

          return (
            <li key={step} className="flex items-center">
              <button
                type="button"
                onClick={() => reachable && onSelect(step)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition",
                  reachable ? "cursor-pointer hover:bg-[#EEF2FF]" : "cursor-not-allowed",
                  isCurrent ? "font-semibold text-[#171717]" : "text-[#6B7280]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isCurrent
                      ? "border-[#3C61DD] bg-[#3C61DD] text-white"
                      : isComplete
                        ? "border-[#3C61DD] bg-white text-[#3C61DD]"
                        : "border-[#D1D5DB] bg-white text-[#9CA3AF]"
                  )}
                >
                  {isComplete && !isCurrent ? <Check className="size-4" /> : step}
                </span>
                <span className="hidden sm:inline">{entry.label}</span>
                <span className="sr-only">
                  {`Step ${step} of ${PROFILE_EDITOR_STEPS.length}: ${entry.label}. ${state}.`}
                </span>
              </button>
              {index < PROFILE_EDITOR_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 hidden h-px w-6 sm:block lg:w-10",
                    step < furthest ? "bg-[#3C61DD]" : "bg-[#E5E7EB]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-sm text-[#6B7280]">
        {`Step ${current} of ${PROFILE_EDITOR_STEPS.length}: ${PROFILE_EDITOR_STEPS[current - 1].label}`}
      </p>
    </nav>
  );
}

/** Lists blocking errors and moves focus to the offending control. */
export function EditorValidationSummary({
  errors,
  onFocusField,
}: {
  errors: Array<{ field: string; message: string }>;
  onFocusField: (field: string) => void;
}) {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      tabIndex={-1}
      id="sp-editor-validation-summary"
      className="rounded-xl border border-[#FDA29B] bg-[#FEF3F2] p-4"
    >
      <h3 className="text-sm font-semibold text-[#B42318]">
        {errors.length === 1
          ? "Fix 1 issue before continuing"
          : `Fix ${errors.length} issues before continuing`}
      </h3>
      <ul className="mt-2 space-y-1">
        {errors.map((error) => (
          <li key={`${error.field}-${error.message}`}>
            <button
              type="button"
              onClick={() => onFocusField(error.field)}
              className="text-left text-sm text-[#B42318] underline underline-offset-2 hover:no-underline"
            >
              {error.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
