"use client";

import { Lock } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SpCard, SpFormField, SpSectionHeader } from "@/components/serviceprovider/ui";
import { ProfessionalOverviewEditor } from "@/components/serviceprovider/ProfessionalOverviewEditor";
import { ProfileMediaManager } from "@/components/serviceprovider/ProfileMediaManager";
import { EDITOR_LIMITS, type EditorDraftModel, type FieldError } from "@/lib/service-provider/profile-editor";
import { focusElementId } from "@/lib/service-provider/profile-navigation";
import { professionalOverviewPlainText } from "@/lib/service-provider/professional-overview";
import { SERVICE_CATEGORIES, type ServiceProviderProfile } from "@/types/service-provider";
import { cn } from "@/lib/utils";

const errorFor = (errors: FieldError[], field: string) =>
  errors.find((error) => error.field === field)?.message ?? null;

/** Splits an enum name like "FundraisingSupport" into readable words. */
const readableCategory = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

/**
 * Step 1 — profile/cover media, locked registration identity, headline,
 * primary category, short bio and the Professional Overview. Media and the
 * Tiptap overview reuse the already-shipped components unchanged.
 */
export function StepIdentityOverview({
  profile,
  model,
  errors,
  onChange,
}: {
  profile: ServiceProviderProfile;
  model: EditorDraftModel;
  errors: FieldError[];
  onChange: (patch: Partial<EditorDraftModel>) => void;
}) {
  const { user } = useAuth();
  const overviewCharacters = professionalOverviewPlainText(model.professionalOverview).length;
  const headlineLength = model.headline.length;

  return (
    <div className="space-y-6">
      <section id={focusElementId("media")} tabIndex={-1} className="scroll-mt-24 space-y-6 outline-none">
        <ProfileMediaManager profile={profile} />
      </section>

      <SpCard>
        <SpSectionHeader
          title="Professional headline"
          description="Your name comes from your verified registration identity and cannot be edited here."
        />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <SpFormField
            id="provider-name"
            label="Provider name"
            description="Captured during registration — non-editable."
          >
            <div className="relative">
              <Input value={user?.name || "Service Provider"} disabled readOnly />
              <Lock
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden="true"
              />
            </div>
          </SpFormField>

          <SpFormField
            id={focusElementId("headline")}
            label="Professional headline"
            required
            description={`${headlineLength}/${EDITOR_LIMITS.headline} characters`}
            error={errorFor(errors, "headline")}
          >
            <Input
              maxLength={EDITOR_LIMITS.headline}
              value={model.headline}
              onChange={(event) => onChange({ headline: event.target.value })}
              placeholder="e.g. Senior UI/UX Designer for SaaS Platforms"
            />
          </SpFormField>
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader
          title="Expertise domain"
          description="Select the primary category clients will find you under."
        />
        <fieldset className="mt-6">
          <legend className="sr-only">Select primary expertise category</legend>
          <div
            id="category"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="radiogroup"
            aria-label="Primary expertise category"
            aria-invalid={!!errorFor(errors, "category") || undefined}
          >
            {SERVICE_CATEGORIES.map((category) => {
              const selected = model.primaryCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ primaryCategory: category })}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition",
                    selected
                      ? "border-[#3C61DD] bg-[#EEF2FF] font-semibold text-[#1E3A8A]"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE]"
                  )}
                >
                  <span>{readableCategory(category)}</span>
                  {selected && <span className="sr-only">Selected</span>}
                </button>
              );
            })}
          </div>
          {errorFor(errors, "category") && (
            <p className="mt-2 text-xs font-medium text-[#B42318]">{errorFor(errors, "category")}</p>
          )}
        </fieldset>
      </SpCard>

      <SpCard>
        <SpSectionHeader
          title="Short bio"
          description="A concise summary. The detailed Professional Overview is below."
        />
        <div className="mt-6">
          <SpFormField
            id="bio"
            label="Short bio"
            description={`${model.bio.length}/${EDITOR_LIMITS.bio} characters`}
            error={errorFor(errors, "bio")}
          >
            <Textarea
              rows={5}
              maxLength={EDITOR_LIMITS.bio}
              value={model.bio}
              onChange={(event) => onChange({ bio: event.target.value })}
              placeholder="Summarize your expertise and the clients you help."
            />
          </SpFormField>
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader
          title="Professional Overview"
          description="Tell clients who you are and why they should choose you."
        />
        <div id={focusElementId("overview")} tabIndex={-1} className="mt-6 scroll-mt-24 outline-none">
          <p className="mb-2 text-xs text-[#6B7280]" aria-live="polite">
            {`${overviewCharacters.toLocaleString()} / ${EDITOR_LIMITS.overviewPlainText.toLocaleString()} characters`}
          </p>
          <ProfessionalOverviewEditor
            value={model.professionalOverview}
            onChange={(document) => onChange({ professionalOverview: document })}
            error={errorFor(errors, "overview")}
          />
        </div>
      </SpCard>
    </div>
  );
}
