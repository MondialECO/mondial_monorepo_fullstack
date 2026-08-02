"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpCard, SpEmptyState, SpFormField, SpSectionHeader } from "@/components/serviceprovider/ui";
import {
  EDITOR_LIMITS,
  newEducation,
  newExperience,
  type EditorDraftModel,
  type FieldError,
} from "@/lib/service-provider/profile-editor";
import { focusElementId } from "@/lib/service-provider/profile-navigation";
import type { ProviderEducation, ProviderExperience } from "@/types/service-provider";

const errorFor = (errors: FieldError[], field: string) =>
  errors.find((error) => error.field === field)?.message ?? null;

type PendingDelete =
  | { kind: "experience"; id: string; label: string }
  | { kind: "education"; id: string; label: string }
  | null;

/**
 * Step 2 — employment history and education. Both lists are optional, but any
 * entered record must be valid. Records are addressed by their stable id, never
 * by array position, so edits and deletes survive reordering.
 */
export function StepExperienceEducation({
  model,
  errors,
  onChange,
}: {
  model: EditorDraftModel;
  errors: FieldError[];
  onChange: (patch: Partial<EditorDraftModel>) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const patchExperience = (id: string, patch: Partial<ProviderExperience>) =>
    onChange({
      experiences: model.experiences.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });

  const patchEducation = (id: string, patch: Partial<ProviderEducation>) =>
    onChange({
      education: model.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "experience") {
      onChange({ experiences: model.experiences.filter((item) => item.id !== pendingDelete.id) });
    } else {
      onChange({ education: model.education.filter((item) => item.id !== pendingDelete.id) });
    }
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <SpCard id={focusElementId("experience")} tabIndex={-1} className="scroll-mt-24 outline-none">
        <SpSectionHeader
          title="Employment history"
          description="Optional. Anything you add must be complete and correctly dated."
        />

        <div className="mt-6 space-y-4">
          {model.experiences.length === 0 && (
            <SpEmptyState
              title="No experience added"
              description="Add a role to show clients where you have worked."
            />
          )}

          {model.experiences.map((item, index) => (
            <fieldset key={item.id} className="rounded-xl border border-[#E5E7EB] p-4">
              <legend className="px-1 text-sm font-semibold text-[#171717]">
                {item.jobTitle.trim() || `Experience ${index + 1}`}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <SpFormField
                  id={`experience-${item.id}-jobTitle`}
                  label="Job title"
                  required
                  error={errorFor(errors, `experience-${item.id}-jobTitle`)}
                >
                  <Input
                    maxLength={EDITOR_LIMITS.jobTitle}
                    value={item.jobTitle}
                    onChange={(event) => patchExperience(item.id, { jobTitle: event.target.value })}
                    placeholder="e.g. Lead Developer"
                  />
                </SpFormField>

                <SpFormField
                  id={`experience-${item.id}-companyName`}
                  label="Company name"
                  required
                  error={errorFor(errors, `experience-${item.id}-companyName`)}
                >
                  <Input
                    maxLength={EDITOR_LIMITS.companyName}
                    value={item.companyName}
                    onChange={(event) =>
                      patchExperience(item.id, { companyName: event.target.value })
                    }
                    placeholder="e.g. Acme Corp"
                  />
                </SpFormField>

                <SpFormField
                  id={`experience-${item.id}-startDate`}
                  label="Start date"
                  required
                  description="Month and year"
                  error={errorFor(errors, `experience-${item.id}-startDate`)}
                >
                  <Input
                    type="month"
                    value={item.startDate}
                    onChange={(event) => patchExperience(item.id, { startDate: event.target.value })}
                  />
                </SpFormField>

                <SpFormField
                  id={`experience-${item.id}-endDate`}
                  label="End date"
                  description={item.isCurrent ? "Not applicable for a current role" : "Month and year"}
                  error={errorFor(errors, `experience-${item.id}-endDate`)}
                >
                  <Input
                    type="month"
                    value={item.endDate ?? ""}
                    disabled={item.isCurrent}
                    onChange={(event) => patchExperience(item.id, { endDate: event.target.value })}
                  />
                </SpFormField>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  id={`experience-${item.id}-current`}
                  checked={item.isCurrent}
                  onChange={(event) =>
                    patchExperience(item.id, {
                      isCurrent: event.target.checked,
                      // A current role must carry no end date.
                      endDate: event.target.checked ? "" : item.endDate,
                    })
                  }
                />
                <label
                  htmlFor={`experience-${item.id}-current`}
                  className="text-sm text-[#374151]"
                >
                  I currently work here
                </label>
              </div>

              <div className="mt-4">
                <SpFormField
                  id={`experience-${item.id}-description`}
                  label="Short description"
                  description={`${(item.description ?? "").length}/${EDITOR_LIMITS.experienceDescription} characters`}
                >
                  <Textarea
                    rows={3}
                    maxLength={EDITOR_LIMITS.experienceDescription}
                    value={item.description ?? ""}
                    onChange={(event) =>
                      patchExperience(item.id, { description: event.target.value })
                    }
                    placeholder="Briefly describe your role and achievements…"
                  />
                </SpFormField>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 text-[#B42318]"
                  onClick={() =>
                    setPendingDelete({
                      kind: "experience",
                      id: item.id,
                      label: item.jobTitle.trim() || `Experience ${index + 1}`,
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                  <span className="sr-only">{` ${item.jobTitle.trim() || `experience ${index + 1}`}`}</span>
                </Button>
              </div>
            </fieldset>
          ))}

          {errorFor(errors, "experience") && (
            <p className="text-xs font-medium text-[#B42318]">{errorFor(errors, "experience")}</p>
          )}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={model.experiences.length >= EDITOR_LIMITS.experiences}
            onClick={() => onChange({ experiences: [...model.experiences, newExperience()] })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add experience
          </Button>
        </div>
      </SpCard>

      <SpCard id={focusElementId("education")} tabIndex={-1} className="scroll-mt-24 outline-none">
        <SpSectionHeader title="Education" description="Optional. Years only — no exact dates." />

        <div className="mt-6 space-y-4">
          {model.education.length === 0 && (
            <SpEmptyState
              title="No education added"
              description="Add a qualification to strengthen your profile."
            />
          )}

          {model.education.map((item, index) => (
            <fieldset key={item.id} className="rounded-xl border border-[#E5E7EB] p-4">
              <legend className="px-1 text-sm font-semibold text-[#171717]">
                {item.degree.trim() || `Education ${index + 1}`}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <SpFormField
                  id={`education-${item.id}-institution`}
                  label="School or university"
                  required
                  error={errorFor(errors, `education-${item.id}-institution`)}
                >
                  <Input
                    maxLength={EDITOR_LIMITS.institution}
                    value={item.institution}
                    onChange={(event) =>
                      patchEducation(item.id, { institution: event.target.value })
                    }
                    placeholder="e.g. Dhaka University"
                  />
                </SpFormField>

                <SpFormField
                  id={`education-${item.id}-degree`}
                  label="Degree"
                  required
                  error={errorFor(errors, `education-${item.id}-degree`)}
                >
                  <Input
                    maxLength={EDITOR_LIMITS.degree}
                    value={item.degree}
                    onChange={(event) => patchEducation(item.id, { degree: event.target.value })}
                    placeholder="e.g. B.Sc. in Computer Science"
                  />
                </SpFormField>

                <SpFormField id={`education-${item.id}-fieldOfStudy`} label="Field of study">
                  <Input
                    maxLength={EDITOR_LIMITS.fieldOfStudy}
                    value={item.fieldOfStudy ?? ""}
                    onChange={(event) =>
                      patchEducation(item.id, { fieldOfStudy: event.target.value })
                    }
                    placeholder="e.g. Software Engineering"
                  />
                </SpFormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SpFormField
                    id={`education-${item.id}-startYear`}
                    label="Start year"
                    required
                    error={errorFor(errors, `education-${item.id}-startYear`)}
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={EDITOR_LIMITS.minEducationYear}
                      value={item.startYear || ""}
                      onChange={(event) =>
                        patchEducation(item.id, { startYear: Number(event.target.value) })
                      }
                    />
                  </SpFormField>

                  <SpFormField
                    id={`education-${item.id}-endYear`}
                    label="End year"
                    description="Leave blank if ongoing"
                    error={errorFor(errors, `education-${item.id}-endYear`)}
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={EDITOR_LIMITS.minEducationYear}
                      value={item.endYear ?? ""}
                      onChange={(event) =>
                        patchEducation(item.id, {
                          endYear: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                  </SpFormField>
                </div>
              </div>

              <div className="mt-4">
                <SpFormField id={`education-${item.id}-description`} label="Description">
                  <Textarea
                    rows={3}
                    maxLength={EDITOR_LIMITS.experienceDescription}
                    value={item.description ?? ""}
                    onChange={(event) =>
                      patchEducation(item.id, { description: event.target.value })
                    }
                    placeholder="Optional details about your studies…"
                  />
                </SpFormField>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 text-[#B42318]"
                  onClick={() =>
                    setPendingDelete({
                      kind: "education",
                      id: item.id,
                      label: item.degree.trim() || `Education ${index + 1}`,
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                  <span className="sr-only">{` ${item.degree.trim() || `education ${index + 1}`}`}</span>
                </Button>
              </div>
            </fieldset>
          ))}

          {errorFor(errors, "education") && (
            <p className="text-xs font-medium text-[#B42318]">{errorFor(errors, "education")}</p>
          )}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={model.education.length >= EDITOR_LIMITS.educationRecords}
            onClick={() => onChange({ education: [...model.education, newEducation()] })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add education
          </Button>
        </div>
      </SpCard>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pendingDelete?.label}?</DialogTitle>
            <DialogDescription>
              This record is removed from your draft. Nothing is published until you submit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
