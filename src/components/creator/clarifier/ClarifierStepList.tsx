"use client";

import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { CLARIFIER_FIELDS, effectiveFields, isAnswerDone } from "@/lib/clarifier-answers";
import type { ClarifierAnswer } from "@/types/creator/journey-api";

type Props = {
  answers: ClarifierAnswer[];
  currentQuestion: number | null;
  stepLabels: string[];
  disabled: boolean;
  onSaveFields: (questionIndex: number, fields: Record<string, string>) => Promise<void>;
};

/** Progress steps; each finished step shows the AI-structured fields, editable without an AI call. */
export function ClarifierStepList({ answers, currentQuestion, stepLabels, disabled, onSaveFields }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (answer: ClarifierAnswer) => {
    const current = effectiveFields(answer);
    setDraft(Object.fromEntries(CLARIFIER_FIELDS[answer.questionIndex - 1].map((k) => [k, current[k] ?? ""])));
    setError(null);
    setEditing(answer.questionIndex);
  };

  const save = async (answer: ClarifierAnswer) => {
    // Only send real changes, so an unchanged "save" doesn't mark the summary stale.
    const current = effectiveFields(answer);
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([k, v]) => v.trim() !== (current[k] ?? "")),
    );
    if (Object.keys(changed).length === 0) {
      setEditing(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSaveFields(answer.questionIndex, changed);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("creator.phase2.clarifier.fieldSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {stepLabels.map((label, idx) => {
        const stepNum = idx + 1;
        const answer = answers.find((a) => a.questionIndex === stepNum);
        const done = isAnswerDone(answer);
        const weak = answer?.status === "accepted_weak";
        const current = currentQuestion === stepNum;
        const fields = done && answer ? effectiveFields(answer) : {};
        const isEditing = editing === stepNum && !!answer;

        return (
          <div key={label} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: done
                    ? weak ? "var(--dr-bg-yellow)" : "var(--dr-bg-green)"
                    : current ? "var(--primary)" : "var(--muted)",
                }}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: weak ? "var(--dr-yellow)" : "var(--p8-green)" }} />
                ) : (
                  <span
                    className="text-badge leading-none font-mono"
                    style={{ color: current ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className={`text-badge ${current ? "font-medium" : ""}`} style={{ color: "var(--foreground)" }}>
                  {label}
                </span>
                {!done && !current && (
                  <span className="text-badge" style={{ color: "var(--muted-foreground)" }}>
                    {t("creator.phase2.clarifier.unlocksAfter", { num: stepNum - 1 })}
                  </span>
                )}
              </div>
              {done && answer && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                  onClick={() => startEdit(answer)}
                  aria-label={t("creator.phase2.clarifier.aria.editFields", { step: label })}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>

            {weak && !isEditing && (
              <p className="pl-7 text-caption" style={{ color: "var(--dr-yellow)" }}>
                {t("creator.phase2.clarifier.weakAnswerHint")}
              </p>
            )}

            {isEditing ? (
              <div className="pl-7 flex flex-col gap-2">
                {CLARIFIER_FIELDS[stepNum - 1].map((key, _, keys) => (
                  <label key={key} className="flex flex-col gap-1">
                    {/* Single-field steps are already named by the step label above. */}
                    {keys.length > 1 && (
                      <span className="text-caption font-medium" style={{ color: "var(--muted-foreground)" }}>
                        {t(`creator.phase2.clarifier.fields.${key}`)}
                      </span>
                    )}
                    <Textarea
                      aria-label={t(`creator.phase2.clarifier.fields.${key}`)}
                      value={draft[key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                      maxLength={1000}
                      rows={3}
                      className="text-caption"
                    />
                  </label>
                ))}
                <p className="text-caption" style={{ color: "var(--muted-foreground)" }}>
                  {t("creator.phase2.clarifier.fieldsEditHint")}
                </p>
                {error && (
                  <p className="text-caption" style={{ color: "var(--destructive)" }}>{error}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => answer && save(answer)} disabled={saving}>
                    {saving && <Loader2 className="animate-spin" />}
                    {t("creator.phase2.clarifier.save")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                    {t("creator.phase2.clarifier.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              Object.keys(fields).length > 0 && (
                <div className="pl-7 flex flex-col gap-0.5">
                  {Object.entries(fields).map(([key, value]) => (
                    <p key={key} className="text-caption leading-relaxed line-clamp-3" style={{ color: "var(--muted-foreground)" }}>
                      {Object.keys(fields).length > 1 && (
                        <span className="font-medium">{t(`creator.phase2.clarifier.fields.${key}`)}: </span>
                      )}
                      {value}
                    </p>
                  ))}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
