"use client";

import { FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useEntrepreneurProgress } from "@/hooks/useEntrepreneurProgress";
import { usePhase2Step1Form } from "@/hooks/usePhase2Step1Form";
import { Input } from "@/components/ui/input";
import PhaseStepShell from "@/components/entrepreneur/PhaseStepShell";
import LockedStepPreview from "@/components/entrepreneur/LockedStepPreview";

/**
 * Phase 2 · Step 1 — Legal Identity. Matches Figma 2.1: single card with
 * company name (full width), then SIREN/SIRET + Legal Form (2 cols),
 * Incorporation Date + Country (2 cols), Registered Address (full width),
 * Industry Code (half width). Right-aligned progress badge.
 */
export default function Phase2Step1Client() {
  const { progress } = useEntrepreneurProgress();
  const { form, formState, autosave, handleSaveDraft, handleNextClick } = usePhase2Step1Form();
  const { register, control } = form;

  // useWatch — unlike top-level form.watch(), this reliably re-renders this
  // component on every keystroke so the progress badge and the Next button
  // gating react to what the user has typed.
  const values = useWatch({ control }) as Record<string, string | undefined>;

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Required vs optional. Anything starred in the label below also has to
  // pass the gate for Next to enable.
  const requiredKeys = [
    "companyName",
    "registrationNumber",
    "legalForm",
    "countryOfRegistration",
    "registeredAddress",
  ] as const;
  const optionalKeys = ["incorporationDate", "industryCode"] as const;

  const totalFields = requiredKeys.length + optionalKeys.length;
  const filled = [...requiredKeys, ...optionalKeys].filter(
    (k) => !!values?.[k]?.toString().trim(),
  ).length;
  const pct = Math.round((filled / totalFields) * 100);

  const allRequiredFilled = requiredKeys.every(
    (k) => !!values?.[k]?.toString().trim(),
  );

  return (
    <PhaseStepShell
      title="Legal Identity"
      subtitle="Enter your company's official registered information. This data will be automatically verified against the national trade registry."
      progressLabel="PROGRESS"
      progressValue={pct >= 100 ? "100% Filled" : `From ${pct}% Filled`}
      progressIcon={FileText}
      primaryAction={{
        label: "Next",
        onClick: handleNextClick,
        disabled: !allRequiredFilled || formState.status === "navigating",
        loading: formState.status === "navigating",
      }}
      secondaryAction={{
        label: "Save Draft",
        onClick: handleSaveDraft,
      }}
      infoBanner={{
        title: "Why need this information",
        description: (
          <>
            Legal details are used to verify your business status with governmental APIs. This
            ensures all entrepreneurs on{" "}
            <span className="text-primary font-medium">mondial.eco</span> are legally compliant and
            eligible for eco-grants.
          </>
        ),
      }}
      lockedPreview={
        <LockedStepPreview
          step={2}
          title="Required Documentation"
          subtitle="KBIS, RIB, Insurance, Tax Certificates"
        />
      }
    >
      <div className="space-y-6">
        {/* Company name (full width) */}
        <Field label="Official Company Name" required>
          <Input
            {...register("companyName")}
            placeholder="EcoSphere Solution SAS"
            className="h-11 bg-card"
          />
        </Field>

        {/* Two-column rows */}
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Registration (SIREN/SIRET)" required>
            <Input
              {...register("registrationNumber")}
              placeholder="987 876 5684"
              className="h-11 bg-card font-mono"
            />
          </Field>
          <Field label="Legal Form" required>
            <select
              {...register("legalForm")}
              className="w-full h-11 px-3 bg-card border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Select…</option>
              <option value="SAS">SAS / SASU</option>
              <option value="SARL">SARL</option>
              <option value="EIRL">EIRL</option>
              <option value="SA">SA</option>
              <option value="MICRO">Micro-Enterprise</option>
            </select>
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Incorporation Date">
            <Input
              {...register("incorporationDate")}
              type="date"
              className="h-11 bg-card"
            />
          </Field>
          <Field label="Country of Registration" required>
            <select
              {...register("countryOfRegistration")}
              className="w-full h-11 px-3 bg-card border border-border rounded-lg text-sm text-foreground"
            >
              <option value="">Select country</option>
              <option value="France">France</option>
              <option value="Belgium">Belgium</option>
              <option value="Luxembourg">Luxembourg</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Germany">Germany</option>
              <option value="Other">Other (EU)</option>
            </select>
          </Field>
        </div>

        {/* Registered address (textarea) */}
        <Field label="Registered Address" required>
          <textarea
            {...register("registeredAddress")}
            rows={2}
            placeholder="154 Avenue, Torento, New York City"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground resize-none"
          />
        </Field>

        {/* Industry code (half width) */}
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Industry Code (NAF / APE)">
            <Input
              {...register("industryCode")}
              placeholder="90.875"
              className="h-11 bg-card font-mono"
            />
          </Field>
        </div>

        {/* Inline status */}
        {autosave.status === "saved" && (
          <p className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Draft saved automatically
          </p>
        )}
        {formState.error && (
          <p className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            {formState.error}
          </p>
        )}
      </div>
    </PhaseStepShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
        {required && (
          <span aria-label="required" className="text-red-500 ml-0.5">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
