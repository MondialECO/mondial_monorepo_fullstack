"use client";

import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CLARIFIER_ASK_ORDER,
  CLARIFIER_TOPIC_FIELDS,
  effectiveFields,
  isTopicDone,
  topicState,
  type TopicState,
} from "@/lib/clarifier-answers";
import type { ClarifierAnswer } from "@/types/creator/journey-api";

type Props = {
  answers: ClarifierAnswer[];
  currentTopic: number | null;
  /** Labels indexed by topic index − 1. */
  topicLabels: string[];
  disabled: boolean;
  onSaveFields: (topicIndex: number, fields: Record<string, string>) => Promise<void>;
  /**
   * Weak topics are edited only through the AI-verified rewrite (same as "Fix it"): a field-only
   * edit can't change the status, so the "thin answer" marker would stay and look like a bug.
   */
  onRewriteWeak: (topicIndex: number) => void;
};

/** Topic marker. Weak must never read as a plain ✓: dashed amber ring + amber check. */
function TopicMarker({ state, current, position }: { state: TopicState; current: boolean; position: number }) {
  if (state === "clear") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--dr-bg-green)" }}>
        <Check className="size-3.5" strokeWidth={3} style={{ color: "var(--p8-green)" }} />
      </span>
    );
  }
  if (state === "weak") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed" style={{ borderColor: "var(--dr-yellow)" }}>
        <Check className="size-3" strokeWidth={2} style={{ color: "var(--dr-yellow)" }} />
      </span>
    );
  }
  const background = current ? "var(--primary)" : state === "unclear" ? "var(--dr-bg-yellow)" : "var(--muted)";
  const color = current ? "var(--primary-foreground)" : state === "unclear" ? "var(--dr-yellow)" : "var(--muted-foreground)";
  return (
    <span
      className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", state === "unclear" && "border")}
      style={{ backgroundColor: background, borderColor: "var(--dr-yellow)" }}
    >
      <span className="text-badge leading-none font-mono" style={{ color }}>{position}</span>
    </span>
  );
}

/** Topic progress in ask order; each finished topic shows the AI-structured fields, editable without an AI call. */
export function ClarifierStepList({ answers, currentTopic, topicLabels, disabled, onSaveFields, onRewriteWeak }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (answer: ClarifierAnswer) => {
    const current = effectiveFields(answer);
    setDraft(Object.fromEntries(CLARIFIER_TOPIC_FIELDS[answer.questionIndex - 1].map((k) => [k, current[k] ?? ""])));
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
      {CLARIFIER_ASK_ORDER.map((topic, position) => {
        const label = topicLabels[topic - 1];
        const answer = answers.find((a) => a.questionIndex === topic);
        const state = topicState(answer);
        const done = isTopicDone(answer);
        const current = currentTopic === topic;
        const fields = done && answer ? effectiveFields(answer) : {};
        const isEditing = editing === topic && !!answer;

        return (
          <div key={topic} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <TopicMarker state={state} current={current} position={position + 1} />
              <span className={cn("text-badge min-w-0 flex-1", current && "font-medium")} style={{ color: "var(--foreground)" }}>
                {label}
              </span>
              {done && answer && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  disabled={disabled}
                  onClick={() => (state === "weak" ? onRewriteWeak(topic) : startEdit(answer))}
                  aria-label={t("creator.phase2.clarifier.aria.editFields", { step: label })}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </div>

            {state === "weak" && !isEditing && (
              <p className="pl-7 text-caption" style={{ color: "var(--dr-yellow)" }}>
                <span className="font-medium">{t("creator.phase2.clarifier.topicState.weak")}</span>
                {" — "}
                {t("creator.phase2.clarifier.weakAnswerHint")}
              </p>
            )}
            {state === "unclear" && (
              <p className="pl-7 text-caption" style={{ color: "var(--muted-foreground)" }}>
                {t("creator.phase2.clarifier.topicState.unclear")}
              </p>
            )}

            {isEditing ? (
              <div className="pl-7 flex flex-col gap-2">
                {CLARIFIER_TOPIC_FIELDS[topic - 1].map((key, _, keys) => (
                  <label key={key} className="flex flex-col gap-1">
                    {/* Single-field topics are already named by the label above. */}
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
