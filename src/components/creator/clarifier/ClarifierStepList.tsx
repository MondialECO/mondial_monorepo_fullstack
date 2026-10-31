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

/**
 * 20px topic marker, no step numbers (topics are not fixed questions). Clear: green check.
 * Weak must never read as a plain ✓: dashed amber ring + amber check. Being asked: a ring with a
 * centre dot (amber while unclear). Unclear elsewhere: amber ring. Empty: a faint outline circle.
 */
function TopicMarker({ state, current }: { state: TopicState; current: boolean }) {
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
  const accent = state === "unclear" ? "var(--dr-yellow)" : "var(--primary)";
  if (current) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: accent }}>
        <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
      </span>
    );
  }
  return state === "unclear" ? (
    <span className="size-5 shrink-0 rounded-full border" style={{ borderColor: "var(--dr-yellow)", backgroundColor: "var(--dr-bg-yellow)" }} />
  ) : (
    <span className="size-5 shrink-0 rounded-full border border-foreground/20" />
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
      {CLARIFIER_ASK_ORDER.map((topic) => {
        const label = topicLabels[topic - 1];
        const answer = answers.find((a) => a.questionIndex === topic);
        const state = topicState(answer);
        const done = isTopicDone(answer);
        const current = currentTopic === topic;
        const fields = done && answer ? effectiveFields(answer) : {};
        const isEditing = editing === topic && !!answer;

        return (
          <div
            key={topic}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border border-transparent p-1",
              current && "border-border bg-muted/60",
              state === "empty" && !current && "opacity-70",
            )}
          >
            <div className="flex items-center gap-2.5">
              <TopicMarker state={state} current={current} />
              <span
                className={cn(
                  "min-w-0 flex-1 font-sans text-badge font-medium",
                  state === "empty" && !current ? "text-muted-foreground" : "text-foreground",
                )}
              >
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
              <p className="pl-7.5 font-sans text-micro" style={{ color: "var(--dr-yellow)" }}>
                <span className="font-medium">{t("creator.phase2.clarifier.topicState.weak")}</span>
                {" — "}
                {t("creator.phase2.clarifier.weakAnswerHint")}
              </p>
            )}
            {state === "unclear" && (
              <p className="pl-7.5 font-sans text-micro text-muted-foreground">
                {t("creator.phase2.clarifier.topicState.unclear")}
              </p>
            )}

            {isEditing ? (
              <div className="pl-7.5 flex flex-col gap-2">
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
                <div className="pl-7.5 flex flex-col">
                  {Object.entries(fields).map(([key, value]) => (
                    <p key={key} className="line-clamp-1 font-sans text-micro leading-relaxed text-muted-foreground" title={value}>
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
