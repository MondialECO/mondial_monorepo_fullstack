"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpCard, SpFormField, SpSectionHeader, SpTagInput } from "@/components/serviceprovider/ui";
import {
  EDITOR_LIMITS,
  hasDuplicate,
  newLanguage,
  type EditorDraftModel,
  type FieldError,
} from "@/lib/service-provider/profile-editor";
import { focusElementId } from "@/lib/service-provider/profile-navigation";
import {
  LANGUAGE_PROFICIENCIES,
  LANGUAGE_PROFICIENCY_LABELS,
  type LanguageProficiency,
} from "@/types/service-provider";

const errorFor = (errors: FieldError[], field: string) =>
  errors.find((error) => error.field === field)?.message ?? null;

/**
 * Step 3 — skills, languages with proficiency, and industries. Industries are
 * preserved here even though the reference design focuses on the first two, so a
 * save can never silently drop them.
 */
export function StepSkillsLanguages({
  model,
  errors,
  onChange,
}: {
  model: EditorDraftModel;
  errors: FieldError[];
  onChange: (patch: Partial<EditorDraftModel>) => void;
}) {
  const patchLanguage = (id: string, patch: Partial<{ language: string; proficiency: LanguageProficiency }>) =>
    onChange({
      languages: model.languages.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      ),
    });

  return (
    <div className="space-y-6">
      <SpCard id={focusElementId("skills")} tabIndex={-1} className="scroll-mt-24 outline-none">
        <SpSectionHeader
          title="Skills"
          description="Add the skills clients search for."
          action={
            <span className="text-sm text-[#6B7280]" aria-live="polite">
              {`${model.skills.length} / ${EDITOR_LIMITS.skills} skills selected`}
            </span>
          }
        />
        <div className="mt-6">
          <SpTagInput
            id="skills"
            label="Skills"
            required
            value={model.skills}
            onChange={(skills) => onChange({ skills })}
            maxItems={EDITOR_LIMITS.skills}
            maxItemLength={EDITOR_LIMITS.skillLength}
            itemLengthError={`Each skill must be ${EDITOR_LIMITS.skillLength} characters or fewer.`}
            description={`Press Enter to add. Maximum ${EDITOR_LIMITS.skills} skills.`}
            placeholder="e.g. UI Design"
            error={errorFor(errors, "skills")}
          />
        </div>
      </SpCard>

      <SpCard id={focusElementId("languages")} tabIndex={-1} className="scroll-mt-24 outline-none">
        <SpSectionHeader
          title="Known languages"
          description="Each language is stored with its proficiency level."
        />

        <div className="mt-6 space-y-4">
          {model.languages.length === 0 && (
            <p className="text-sm text-[#6B7280]">No languages added yet.</p>
          )}

          {model.languages.map((entry, index) => {
            const duplicate =
              !!entry.language.trim() &&
              hasDuplicate(
                model.languages
                  .filter((other) => other.id !== entry.id)
                  .map((other) => other.language),
                entry.language
              );

            return (
              <div key={entry.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <SpFormField
                  id={`language-${entry.id}`}
                  label={`Language ${index + 1}`}
                  error={
                    duplicate
                      ? "Duplicate languages are not allowed."
                      : errorFor(errors, `language-${entry.id}`)
                  }
                >
                  <Input
                    maxLength={EDITOR_LIMITS.languageLength}
                    value={entry.language}
                    onChange={(event) => patchLanguage(entry.id, { language: event.target.value })}
                    placeholder="e.g. English"
                  />
                </SpFormField>

                <SpFormField id={`language-${entry.id}-proficiency`} label="Proficiency">
                  <Select
                    value={entry.proficiency}
                    onValueChange={(value) =>
                      patchLanguage(entry.id, { proficiency: value as LanguageProficiency })
                    }
                  >
                    <SelectTrigger aria-label={`Proficiency for language ${index + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_PROFICIENCIES.map((level) => (
                        <SelectItem key={level} value={level}>
                          {LANGUAGE_PROFICIENCY_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SpFormField>

                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 min-w-11 sm:mt-8"
                  onClick={() =>
                    onChange({ languages: model.languages.filter((other) => other.id !== entry.id) })
                  }
                >
                  <Trash2 className="size-4 text-[#B42318]" aria-hidden="true" />
                  <span className="sr-only">
                    {`Remove language ${entry.language.trim() || index + 1}`}
                  </span>
                </Button>
              </div>
            );
          })}

          {errorFor(errors, "languages") && (
            <p className="text-xs font-medium text-[#B42318]">{errorFor(errors, "languages")}</p>
          )}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={model.languages.length >= EDITOR_LIMITS.languages}
            onClick={() => onChange({ languages: [...model.languages, newLanguage()] })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add language
          </Button>
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader
          title="Expertise domains"
          description="The sectors and industry domains you specialize in (e.g. Technology, E-commerce, FinTech, Healthcare, Education)."
        />
        <div className="mt-6">
          <SpTagInput
            id="industries"
            label="Expertise domains"
            value={model.industries}
            onChange={(industries) => onChange({ industries })}
            maxItems={EDITOR_LIMITS.industries}
            maxItemLength={EDITOR_LIMITS.industryLength}
            itemLengthError={`Each domain must be ${EDITOR_LIMITS.industryLength} characters or fewer.`}
            description={`Press Enter to add. Maximum ${EDITOR_LIMITS.industries} domains.`}
            placeholder="e.g. Technology, FinTech, E-commerce, Healthcare"
            error={errorFor(errors, "industries")}
          />
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader
          title="Social & Web links"
          description="Add your professional profiles, GitHub, portfolio, or website."
        />
        <div className="mt-6 space-y-4">
          {(model.socialLinks ?? []).length === 0 && (
            <p className="text-sm text-[#6B7280]">No links added yet.</p>
          )}

          {(model.socialLinks ?? []).map((link, index) => (
            <div key={link.id} className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-start">
              <SpFormField id={`social-${link.id}-platform`} label={`Platform ${index + 1}`}>
                <Select
                  value={link.platform}
                  onValueChange={(platform) =>
                    onChange({
                      socialLinks: model.socialLinks.map((s) =>
                        s.id === link.id ? { ...s, platform } : s
                      ),
                    })
                  }
                >
                  <SelectTrigger aria-label={`Platform for link ${index + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="GitHub">GitHub</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Twitter">Twitter / X</SelectItem>
                    <SelectItem value="Dribbble">Dribbble</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </SpFormField>

              <SpFormField id={`social-${link.id}-url`} label="URL">
                <Input
                  value={link.url}
                  onChange={(event) =>
                    onChange({
                      socialLinks: model.socialLinks.map((s) =>
                        s.id === link.id ? { ...s, url: event.target.value } : s
                      ),
                    })
                  }
                  placeholder="https://..."
                />
              </SpFormField>

              <Button
                type="button"
                variant="outline"
                className="min-h-11 min-w-11 sm:mt-8"
                onClick={() =>
                  onChange({
                    socialLinks: model.socialLinks.filter((s) => s.id !== link.id),
                  })
                }
              >
                <Trash2 className="size-4 text-[#B42318]" aria-hidden="true" />
                <span className="sr-only">{`Remove link ${link.platform}`}</span>
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={(model.socialLinks ?? []).length >= EDITOR_LIMITS.socialLinks}
            onClick={() =>
              onChange({
                socialLinks: [...(model.socialLinks ?? []), { id: `local-${Math.random().toString(36).slice(2, 10)}`, platform: "LinkedIn", url: "" }],
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add link
          </Button>
        </div>
      </SpCard>
    </div>
  );
}
