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
          title="Industries"
          description="The sectors you work in. Used to match you with relevant client briefs."
        />
        <div className="mt-6">
          <SpTagInput
            id="industries"
            label="Industries"
            value={model.industries}
            onChange={(industries) => onChange({ industries })}
            maxItems={EDITOR_LIMITS.industries}
            maxItemLength={EDITOR_LIMITS.industryLength}
            itemLengthError={`Each industry must be ${EDITOR_LIMITS.industryLength} characters or fewer.`}
            description={`Press Enter to add. Maximum ${EDITOR_LIMITS.industries} industries.`}
            placeholder="e.g. Fintech"
            error={errorFor(errors, "industries")}
          />
        </div>
      </SpCard>
    </div>
  );
}
