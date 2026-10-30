"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, ArrowRight, X, Check, Copy, Send, FileText, Pencil } from "lucide-react";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { isTerminalStatus } from "@/types/creator/ai";
import { toAiError } from "@/lib/ai-errors";
import {
  POLL_INTERVAL_MS as SHARED_POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS as SHARED_POLL_MAX_ATTEMPTS,
  POLL_MAX_MS,
  useAiCredits,
} from "@/hooks/queries/creator-ai";
import { useTranslation } from "@/hooks/useTranslation";
import { ClarifierStepList } from "@/components/creator/clarifier/ClarifierStepList";
import {
  CLARIFIER_MAX_ATTEMPTS,
  CLARIFIER_TOTAL_QUESTIONS,
  buildRawIdea,
  currentQuestionIndex,
  getClarifierAnswers,
  isAnswerDone,
  summaryIsStale,
} from "@/lib/clarifier-answers";
import { initializeClarifierWebSocket, getClarifierWebSocket } from "@/lib/clarifier-websocket";
import type { ClarifierAnswer, ClarifierChatMessage } from "@/types/creator/journey-api";
import { useAuth } from "@/context/AuthContext";

type Message = ClarifierChatMessage;

// The opener is rendered locally, never persisted; the backend transcript starts with the first answer.
const OPENER_ID = "opener";

export default function AIClarifierPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const urlIdeaId = searchParams.get("ideaId");
  const { state, setState, refetch } = useCreatorProgress();
  const { token } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initInFlightRef = useRef(false);
  const wsInitializedRef = useRef(false);

  const effectiveIdeaId = urlIdeaId || state.activeIdeaId;

  // Explicit Clarifier Initialization (Section 5)
  useEffect(() => {
    if (urlIdeaId) {
      if (state.activeIdeaId !== urlIdeaId) {
        refetch(urlIdeaId);
      }
      return;
    }

    if (state.activeIdeaId) {
      router.replace(`/dashboard/creator/phase-2/clarifier?ideaId=${state.activeIdeaId}`);
      return;
    }

    // No ideaId in query and no activeIdeaId in state -> brand-new creator entering Clarifier
    if (initInFlightRef.current) return;
    initInFlightRef.current = true;

    creatorJourneyApi.initializeClarifierIdea()
      .then((data) => {
        if (data.ideaId) {
          router.replace(`/dashboard/creator/phase-2/clarifier?ideaId=${data.ideaId}`);
          refetch(data.ideaId);
        }
      })
      .catch((err) => {
        console.error("Failed to initialize clarifier idea:", err);
      });
  }, [urlIdeaId, state.activeIdeaId, refetch, router]);

  // WebSocket initialization
  useEffect(() => {
    if (!token || wsInitializedRef.current) return;
    wsInitializedRef.current = true;

    try {
      const ws = initializeClarifierWebSocket(token);
      ws.connect().catch((err) => {
        console.error("[Clarifier] WebSocket connection failed, will fallback to HTTP:", err);
      });

      // Register callbacks
      ws.onMessageChunk((chunk) => {
        setStreamingMessage((prev) => prev + chunk);
      });

      ws.onMessageComplete((data) => {
        // Add complete message to messages array
        const completeMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.aiMessage.text,
          questionIndex: currentQuestionIndex(answers),
        };
        setMessages((prev) => [...prev, completeMessage]);
        setStreamingMessage("");
        setIsTyping(false);

        // Update answers with new topic status
        if (data.topicStatus) {
          syncPhase2({ clarifierAnswers: answers });
        }
      });

      ws.onError((error) => {
        console.error("[Clarifier] WebSocket error:", error);
        setStreamingMessage("");
        setIsTyping(false);
      });

      return () => {
        ws.disconnect();
      };
    } catch (err) {
      console.error("[Clarifier] Failed to initialize WebSocket:", err);
    }
  }, [token]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<ClarifierAnswer[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeSlow, setFinalizeSlow] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Question (1–6) whose finished answer is being re-written in the input (null = not editing).
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  // AI feedback when a re-written answer was not accepted (the old answer is kept).
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  const phase2 = state.journeyState?.phase2;
  const { data: credits } = useAiCredits();

  // Backend-authoritative transcript + answer records → local view state.
  useEffect(() => {
    setMessages((phase2?.chatMessages ?? []).filter((m) => m.id !== OPENER_ID && m.id !== "1"));
    setAnswers(getClarifierAnswers(phase2));
  }, [phase2]);

  const syncPhase2 = (patch: { chatMessages?: Message[]; clarifierAnswers?: ClarifierAnswer[]; clarifierSessionId?: string | null; clarifierSummarizedAt?: string | null }) =>
    setState((prev) => ({
      ...prev,
      journeyState: { ...prev.journeyState, phase2: { ...prev.journeyState.phase2, ...patch } },
    }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // While finalizing (an up-to-3-minute poll), acknowledge a long wait: after 40s
  // swap the sub-line so the screen doesn't read as stuck. Clears automatically when
  // finalizing ends — early completion, error, or navigation unmounting the component.
  useEffect(() => {
    if (!finalizing) {
      setFinalizeSlow(false);
      return;
    }
    const t = setTimeout(() => setFinalizeSlow(true), 40000);
    return () => clearTimeout(t);
  }, [finalizing]);

  const handleSend = async () => {
    const userText = inputValue.trim();
    if (!userText || isTyping || finalizing) return;

    // ── Re-write a finished answer: the AI re-judges it; a revise keeps the old answer. ──
    if (editingQuestion !== null) {
      setIsTyping(true);
      setEditFeedback(null);
      try {
        const res = await creatorJourneyApi.editClarifierAnswer(editingQuestion, { mode: "answer", answer: userText }, effectiveIdeaId);
        setAnswers(res.answers);
        syncPhase2({ clarifierAnswers: res.answers });
        if (res.verdict === "revise") {
          setEditFeedback(res.aiUsed
            ? res.feedback ?? t("creator.phase2.clarifier.editNotAccepted")
            : t("creator.phase2.clarifier.editAiUnavailable"));
        } else {
          setEditingQuestion(null);
          setInputValue("");
        }
      } catch (err) {
        setEditFeedback(toAiError(err).message);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (currentQuestion === null) return;
    const priorMessages = messages;

    // Optimistic user bubble; the server transcript replaces it on success.
    setMessages([...messages, { id: `pending-${Date.now()}`, sender: "user", text: userText, questionIndex: currentQuestion }]);
    setInputValue("");
    setIsTyping(true);
    setStreamingMessage("");

    try {
      // Try WebSocket first
      const ws = getClarifierWebSocket();
      if (ws && ws.isConnected()) {
        await ws.sendMessage(userText, t.locale, effectiveIdeaId || "", currentQuestion.toString());
        return;
      }

      // Fallback to HTTP if WebSocket not available
      console.warn("[Clarifier] WebSocket not connected, using HTTP fallback");
      const res = await creatorJourneyApi.chatMessage(userText, t.locale, effectiveIdeaId);
      setMessages(res.messages);
      setAnswers(res.answers);
      syncPhase2({ chatMessages: res.messages, clarifierAnswers: res.answers });
    } catch (err) {
      // Roll back the optimistic turn, restore the draft, and surface the reason.
      setMessages([...priorMessages, { id: `err-${Date.now()}`, sender: "ai", text: toAiError(err).message }]);
      setInputValue(userText);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveFields = async (questionIndex: number, fields: Record<string, string>) => {
    try {
      const res = await creatorJourneyApi.editClarifierAnswer(questionIndex, { mode: "fields", fields }, effectiveIdeaId);
      setAnswers(res.answers);
      syncPhase2({ clarifierAnswers: res.answers });
    } catch (err) {
      throw new Error(toAiError(err).message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — silently no-op.
    }
  };

  // Pull a finished answer's current text into the input; handleSend then re-judges it.
  const handleEditStart = (questionIndex: number) => {
    if (isTyping || finalizing) return;
    const answer = answers.find((a) => a.questionIndex === questionIndex);
    if (!isAnswerDone(answer)) return;
    setInputValue(answer!.rawAnswer);
    setEditingQuestion(questionIndex);
    setEditFeedback(null);
    setCopiedId(null);
  };

  const handleEditCancel = () => {
    setEditingQuestion(null);
    setEditFeedback(null);
    setInputValue("");
  };

  // Poll the C-2 clarifier session until terminal, using the shared R12 policy
  // (60 attempts / 3-minute wall-clock / 2500ms — creator-ai.ts). Returns null on timeout.
  const pollClarifier = async (sessionId: string) => {
    const startTime = Date.now();
    for (let i = 0; i < SHARED_POLL_MAX_ATTEMPTS; i++) {
      const session = await creatorAiApi.getClarifier(sessionId);
      if (isTerminalStatus(session.status)) return session;
      if (Date.now() - startTime >= POLL_MAX_MS) return null; // 3-minute wall-clock cap
      await new Promise((r) => setTimeout(r, SHARED_POLL_INTERVAL_MS));
    }
    return null;
  };

  const handleComplete = async () => {
    if (finalizing) return;
    setFinalizeError(null);
    setFinalizing(true);
    try {
      const rawIdea = buildRawIdea(answers, state.project?.name, t("creator.phase2.clarifier.defaultIdeaName", "My Idea"));

      // Start the C-2 AI clarifier (1 credit), poll it, then map onto the project.
      const { sessionId } = await creatorAiApi.startClarifier(
        {
          rawIdea,
          businessIdeaId: effectiveIdeaId ?? undefined,
        },
        t.locale
      );
      const session = await pollClarifier(sessionId);
      if (!session) throw new Error(t("creator.phase2.clarifier.timeoutError"));

      // finalize-clarifier is tolerant of a partial/failed output (falls back to a
      // 50 clarity score + editable summary), so we map on any terminal status.
      const result = await creatorJourneyApi.finalizeClarifier(sessionId, effectiveIdeaId);

      // Two distinct failure kinds — show an honest, specific message and allow retry.
      // Do NOT navigate or spread empty fields into state on either failure.
      if (result.aiRequestFailed) {
        // The AI service was unavailable (unreachable / rate-limited) — rewording won't help.
        setFinalizeError(t("creator.phase2.clarifier.aiUnavailableError"));
        setFinalizing(false);
        return;
      }
      if (result.aiParseFailed) {
        // The AI replied but we couldn't interpret it — rewording the idea can help.
        setFinalizeError(t("creator.phase2.clarifier.aiParseError"));
        setFinalizing(false);
        return;
      }

      // Compute final values with proper fallbacks BEFORE spreading result.project
      const firstAnswer = rawIdea.problemStatement.trim();
      const clarityScoreFinal = Math.round(result.clarityScore ?? 50);
      const conceptFinal =
        (result.project?.concept as string) ||
        firstAnswer.slice(0, 100) ||
        t("creator.phase2.clarifier.defaultIdeaName");

      setState((prev) => ({
        ...prev,
        project: {
          ...prev.project,
          ...(result.project || {}),
          clarityScore: clarityScoreFinal,
          concept: conceptFinal,
          exists: true,
        },
      }));
      syncPhase2({
        clarifierSessionId: result.clarifierSessionId ?? sessionId,
        clarifierSummarizedAt: result.clarifierSummarizedAt ?? null,
      });

      // Navigate — idea-summary will show data from local state immediately
      router.push("/dashboard/creator/phase-2/idea-summary");
    } catch (err) {
      setFinalizeError(toAiError(err).message);
      setFinalizing(false);
    }
  };

  // All progress derives from the answer records — never from counting user messages,
  // which include rejected attempts.
  const totalQuestions = CLARIFIER_TOTAL_QUESTIONS;
  const answeredCount = answers.filter(isAnswerDone).length;
  const currentQuestion = currentQuestionIndex(answers);
  const summaryReady = currentQuestion === null;
  const currentAttempts = answers.find((a) => a.questionIndex === currentQuestion)?.attempts ?? 0;
  const hasSummary = !!phase2?.clarifierSessionId;
  const summaryStale = hasSummary && summaryIsStale(answers, phase2?.clarifierSummarizedAt);
  const firstAnswer = answers.find((a) => a.questionIndex === 1);
  const journalText = isAnswerDone(firstAnswer) ? firstAnswer!.rawAnswer : "";
  // Only the latest bubble per question is that question's answer; earlier ones are rejected attempts.
  const latestUserMsgByQuestion = new Map<number, string>();
  let legacyOrdinal = 0;
  for (const m of messages) {
    if (m.sender !== "user") continue;
    const q = m.questionIndex ?? ++legacyOrdinal;
    latestUserMsgByQuestion.set(q, m.id);
  }
  const questionOfMessage = (id: string) => [...latestUserMsgByQuestion].find(([, mid]) => mid === id)?.[0];
  const ringPct = Math.min(Math.round((answeredCount / totalQuestions) * 100), 100);

  // An unchanged summary is free to revisit; only new or edited answers cost credits.
  // The price is server-configured (Ai:CreditCosts), so never hardcode it in copy.
  const clarifierCost = credits?.costs?.IdeaClarifier;
  const regenerateLabel = clarifierCost
    ? `${t("creator.phase2.clarifier.regenerateSummary")} (${t("creator.phase2.clarifier.creditCost", { count: clarifierCost })})`
    : t("creator.phase2.clarifier.regenerateSummary");
  const cta = !hasSummary
    ? { label: t("creator.phase2.clarifier.generateSummary"), note: t("creator.phase2.clarifier.finalizeDesc"), onClick: handleComplete }
    : summaryStale
      ? { label: regenerateLabel, note: t("creator.phase2.clarifier.regenerateDesc"), onClick: handleComplete }
      : { label: t("creator.phase2.clarifier.viewSummary"), note: t("creator.phase2.clarifier.viewSummaryDesc"), onClick: () => router.push("/dashboard/creator/phase-2/idea-summary") };

  const getRingBand = (answered: number, total: number): { label: string; color: string } => {
    if (answered <= 0) return { label: t("creator.phase2.clarifier.ringBands.notStarted"), color: "var(--muted-foreground)" };
    if (answered <= 2) return { label: t("creator.phase2.clarifier.ringBands.gettingStarted"), color: "var(--dr-yellow)" };
    if (answered <= 4) return { label: t("creator.phase2.clarifier.ringBands.developing"), color: "var(--dr-yellow)" };
    if (answered < total) return { label: t("creator.phase2.clarifier.ringBands.almostThere"), color: "var(--primary)" };
    return { label: t("creator.phase2.clarifier.ringBands.allAnswered"), color: "var(--p8-green)" };
  };

  const stepLabels = [
    t("creator.phase2.clarifier.stepLabels.problem"),
    t("creator.phase2.clarifier.stepLabels.targetUsers"),
    t("creator.phase2.clarifier.stepLabels.alternatives"),
    t("creator.phase2.clarifier.stepLabels.solution"),
    t("creator.phase2.clarifier.stepLabels.edge"),
    t("creator.phase2.clarifier.stepLabels.risk"),
  ];

  const band = getRingBand(answeredCount, totalQuestions);
  const ringR = 52;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - ringPct / 100);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* ── Heading block ── */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
            {t("creator.phase2.clarifier.mainTitle")}
          </h1>
          <p className="text-base max-w-[780px]" style={{ color: "var(--muted-foreground)" }}>
            {t("creator.phase2.clarifier.mainSubtitle", { count: totalQuestions })}
          </p>
        </div>

        {/* ── Two columns (stack below lg) ──
            Cards: lit white edge (--card-edge) so they read as raised on the darker
            page, plus shadow-sm — a Tailwind default that deliberately approximates
            the design's softer 0 0 22px ambient glow (project uses default shadows). */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          {/* LEFT: conversation card */}
          <section
            className="w-full flex-1 rounded-2xl border shadow-sm overflow-hidden flex flex-col min-w-0"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
          >
            {/* ── Assistant header (FIXED TOP) ── */}
            <div className="px-5 pt-5 pb-3 shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center shrink-0 border"
                  style={{ width: 48, height: 48, backgroundColor: "var(--popover)", borderColor: "var(--border)" }}
                >
                  {/* Robot avatar — DELIBERATE exception to the lucide-only icon rule: this
                      is a raster character illustration (artwork), not a symbol. The library
                      has no equivalent and its Bot glyph would read as empty in this tile.
                      Native 456x376 → crisp at this ~30px leaf. Source: exported from Figma. */}
                  <Image
                    src="/icons/phase2/robot.png"
                    alt={t("creator.phase2.clarifier.aiAssistantAlt", "AI assistant")}
                    width={30}
                    height={25}
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                    {t("creator.phase2.clarifier.title")}
                  </p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {t("creator.phase2.clarifier.subtitle", { count: totalQuestions })}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Transcript surface — SCROLLABLE MIDDLE ──
                min-h ensures chat area always has space to scroll,
                overflow-y-auto keeps messages scrollable like proper chat UI. */}
            <div
              className="min-h-[400px] sm:min-h-[500px] overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]"
              style={{ backgroundColor: "var(--popover)" }}
            >
                {[{ id: OPENER_ID, sender: "ai" as const, text: t("creator.phase2.clarifier.opener") }, ...messages].map((msg) => {
                  const isUser = msg.sender === "user";
                  // Send-failure notes are pushed as ai-sender messages with an "err-" id
                  // (handleSend rollback). Flag them for destructive styling — no logic change.
                  const isError = msg.id.startsWith("err-");
                  const isFeedback = "kind" in msg && msg.kind === "feedback";
                  const answerQuestion = isUser ? questionOfMessage(msg.id) : undefined;
                  const answer = answers.find((a) => a.questionIndex === answerQuestion);
                  // The latest bubble shows the current answer text, so an accepted edit appears in place.
                  const text = answer && isAnswerDone(answer) ? answer.rawAnswer : msg.text;
                  const canEdit = isAnswerDone(answer);
                  const isEditing = canEdit && editingQuestion === answerQuestion;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* "Editing" tag on the answer currently pulled into the input */}
                      {isEditing && (
                        <span className="mb-1 text-badge font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                          {t("creator.phase2.clarifier.editingBadge")}
                        </span>
                      )}
                      {/* Assistant and user bubbles share bg/border/radius by design —
                          they differ only by alignment and max width. Off-screen speaker
                          label distinguishes them for assistive tech. The answer being
                          edited gets a --primary border to tie it to the input below. */}
                      <div
                        className={`rounded-2xl border px-[18px] py-[14px] text-body leading-relaxed ${isUser ? "max-w-[548px]" : "max-w-[580px]"}`}
                        style={{
                          backgroundColor: isError
                            ? "color-mix(in srgb, var(--destructive) 8%, transparent)"
                            : isFeedback ? "var(--dr-bg-yellow)" : "var(--card)",
                          borderColor: isEditing ? "var(--primary)" : isError ? "var(--destructive)" : isFeedback ? "var(--dr-yellow)" : "var(--border)",
                          color: isError ? "var(--destructive)" : "var(--foreground)",
                        }}
                      >
                        <span className="sr-only">{isError ? t("creator.phase2.clarifier.sr.errorPrefix", "Error: ") : isUser ? t("creator.phase2.clarifier.sr.youPrefix", "You: ") : t("creator.phase2.clarifier.sr.assistantPrefix", "Assistant: ")}</span>
                        <span className="whitespace-pre-line">{text}</span>
                      </div>

                      {/* Edit-in-place + copy actions on user messages. Edit populates
                          the input and marks this index; gated on !isTyping && !finalizing
                          (no summaryReady gate — editing before finalize is the key case).
                          Hidden on the message currently being edited (it's in the input). */}
                      {canEdit && !isEditing && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => answerQuestion && handleEditStart(answerQuestion)}
                            disabled={isTyping || finalizing}
                            aria-label={t("creator.phase2.clarifier.aria.editAnswer", "Edit your answer")}
                            className="inline-flex items-center text-badge transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: "var(--muted-foreground)" }}
                            onMouseEnter={(e) => { if (!isTyping && !finalizing) e.currentTarget.style.color = "var(--foreground)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, text)}
                            aria-label={t("creator.phase2.clarifier.aria.copyAnswer", "Copy your answer")}
                            className="inline-flex items-center gap-1 text-badge transition-colors"
                            style={{ color: copiedId === msg.id ? "var(--p8-green)" : "var(--muted-foreground)" }}
                            onMouseEnter={(e) => { if (copiedId !== msg.id) e.currentTarget.style.color = "var(--foreground)"; }}
                            onMouseLeave={(e) => { if (copiedId !== msg.id) e.currentTarget.style.color = "var(--muted-foreground)"; }}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-4 w-4" /> {t("creator.phase2.clarifier.copied")}
                              </>
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Streaming message or thinking indicator */}
                {isTyping && (
                  <div className="flex flex-col items-start">
                    <div
                      className="rounded-2xl border px-[18px] py-[14px] max-w-[580px]"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                    >
                      {streamingMessage ? (
                        <>
                          <span className="sr-only">{t("creator.phase2.clarifier.sr.assistantTyping", "Assistant is typing")}</span>
                          <span className="text-body whitespace-pre-line" style={{ color: "var(--foreground)" }}>
                            {streamingMessage}
                            <span className="animate-pulse">▌</span>
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="sr-only">{t("creator.phase2.clarifier.sr.assistantTyping", "Assistant is typing")}</span>
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--primary)" }} />
                          <span className="text-body" style={{ color: "var(--muted-foreground)" }}>
                            {t("creator.phase2.clarifier.thinking")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* ── Input row + keyboard hint (FIXED BOTTOM) ──
                Renders while questions remain OR while editing — editing takes precedence
                so an answer can be revised even after all six are answered (issue 1). Once
                not editing and summaryReady, the finalize states below render instead. */}
            {editingQuestion !== null || !summaryReady ? (
              <div className="px-5 pt-3 pb-5 shrink-0 border-t flex flex-col" style={{ borderColor: "var(--border)" }}>
                {editingQuestion !== null && (
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-badge font-medium" style={{ color: "var(--primary)" }}>
                      {t("creator.phase2.clarifier.editingTitle")}
                    </span>
                    <button
                      onClick={handleEditCancel}
                      className="inline-flex items-center gap-1 text-badge transition-colors"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                    >
                      <X className="h-3.5 w-3.5" /> {t("creator.phase2.clarifier.cancel")}
                    </button>
                  </div>
                )}
                <div
                  className="flex items-end gap-2 rounded-xl border p-1.5 focus-within:ring-1 focus-within:ring-[var(--ring)] transition-shadow"
                  style={{ backgroundColor: "var(--popover)", borderColor: editingQuestion !== null ? "var(--primary)" : "var(--border)" }}
                >
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={editingQuestion !== null ? t("creator.phase2.clarifier.placeholderRevise") : t("creator.phase2.clarifier.placeholderType")}
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 resize-none bg-transparent outline-none border-none px-3 py-2.5 text-input min-h-[40px] max-h-[120px] placeholder:text-muted-foreground"
                    style={{ color: "var(--foreground)" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    aria-label={editingQuestion !== null ? t("creator.phase2.clarifier.aria.saveEdit", "Save edit") : t("creator.phase2.clarifier.aria.sendAnswer", "Send answer")}
                    className="flex items-center justify-center rounded-lg shrink-0 transition-opacity disabled:opacity-50"
                    style={{ width: 44, height: 44, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {isTyping ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : editingQuestion !== null ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {editingQuestion !== null && editFeedback && (
                  <p role="status" className="mt-2 rounded-lg border px-3 py-2 text-caption" style={{ backgroundColor: "var(--dr-bg-yellow)", borderColor: "var(--dr-yellow)", color: "var(--foreground)" }}>
                    {editFeedback}
                  </p>
                )}
                {editingQuestion === null && currentAttempts > 0 && (
                  <p className="mt-2 text-center text-caption" style={{ color: "var(--dr-yellow)" }}>
                    {t("creator.phase2.clarifier.attemptHint", { current: currentAttempts + 1, max: CLARIFIER_MAX_ATTEMPTS })}
                  </p>
                )}
                <p className="mt-2 text-center text-caption" style={{ color: "var(--muted-foreground)" }}>
                  {editingQuestion !== null
                    ? t("creator.phase2.clarifier.pressEnterSave")
                    : t("creator.phase2.clarifier.pressEnterSend")}
                </p>
              </div>
            ) : finalizeError ? (
              /* FINALIZE ERROR — retry is always possible; the six answers stay in
                 messages/state (finalize failure never clears them), so nothing is lost. */
              <div
                className="mt-auto shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "color-mix(in srgb, var(--destructive) 12%, transparent)" }}
                >
                  <X className="h-5 w-5" strokeWidth={3} style={{ color: "var(--destructive)" }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-card-title font-semibold" style={{ color: "var(--foreground)" }}>
                    {t("creator.phase2.clarifier.errorTitle")}
                  </h3>
                  <p className="text-caption max-w-xs" style={{ color: "var(--destructive)" }}>
                    {finalizeError}
                  </p>
                  <p className="text-caption max-w-xs mx-auto" style={{ color: "var(--muted-foreground)" }}>
                    {t("creator.phase2.clarifier.errorNotice")}
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-button font-semibold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {t("creator.phase2.clarifier.tryAgain")} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : finalizing ? (
              /* FINALIZING — the AI clarifier is running + being polled. */
              <div
                className="mt-auto shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "var(--muted)" }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <h3 className="text-card-title font-semibold" style={{ color: "var(--foreground)" }}>
                  {t("creator.phase2.clarifier.finalizingTitle")}
                </h3>
                <p className="text-caption max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                  {finalizeSlow
                    ? t("creator.phase2.clarifier.finalizingSlow")
                    : t("creator.phase2.clarifier.finalizingNormal")}
                </p>
              </div>
            ) : (
              /* FINALIZE CTA — replaces the input entirely; the action a user must take
                 or lose their work. Says what finalizing does, not just the button name. */
              <div
                className="mt-auto shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "var(--dr-bg-green)" }}
                >
                  <Check className="h-5 w-5" strokeWidth={3} style={{ color: "var(--p8-green)" }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-card-title font-semibold" style={{ color: "var(--foreground)" }}>
                    {t("creator.phase2.clarifier.allQuestionsAnswered")}
                  </h3>
                  <p className="text-caption max-w-sm mx-auto" style={{ color: "var(--muted-foreground)" }}>
                    {cta.note}
                  </p>
                </div>
                <button
                  onClick={cta.onClick}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-button font-semibold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {cta.label} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* RIGHT: progress panel (STICKY) */}
          <aside
            className="w-full lg:w-[300px] rounded-2xl border shadow-sm px-6 pt-9 pb-6 flex flex-col gap-6 shrink-0 lg:sticky lg:top-0 lg:h-fit"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
          >
            {/* ── Clarity ring + band label + finalize cue ── */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative" style={{ width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
                  {/* track */}
                  <circle cx="60" cy="60" r={ringR} fill="none" strokeWidth="8" stroke="var(--muted)" />
                  {/* progress arc — starts at 12 o'clock (rotate -90), travels clockwise */}
                  <circle
                    cx="60"
                    cy="60"
                    r={ringR}
                    fill="none"
                    strokeWidth="8"
                    stroke={band.color}
                    strokeLinecap="round"
                    strokeDasharray={ringC}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-semibold tabular-nums" style={{ color: band.color }}>
                    {ringPct}%
                  </span>
                </div>
              </div>
              <span className="text-badge font-medium uppercase tracking-wide" style={{ color: band.color }}>
                {band.label}
              </span>

              {/* Finalize prominence: the full ring never stands alone. Once every
                  question is answered the ring shows 100% green, but summaryReady only
                  flips when the chat-message response returns — so in that in-flight
                  window (answeredCount === total, summaryReady false) we show an explicit
                  in-progress note, and the finalize action the moment it's ready. The
                  ring reaching full is therefore always paired with one or the other. */}
              {summaryReady ? (
                <div className="w-full flex flex-col items-center gap-2 pt-1">
                  {(!hasSummary || summaryStale) && (
                    <p className="text-caption text-center" style={{ color: "var(--muted-foreground)" }}>
                      {hasSummary ? t("creator.phase2.clarifier.summaryOutdated") : t("creator.phase2.clarifier.notDoneYet")}
                    </p>
                  )}
                  <button
                    onClick={cta.onClick}
                    disabled={finalizing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-badge font-semibold transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {finalizing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> {t("creator.phase2.clarifier.finalizing")}
                      </>
                    ) : (
                      <>
                        {cta.label} <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Divider — drawn as a 1px rule (the design exports it as an image) */}
            <div className="h-px w-full" style={{ backgroundColor: "var(--border)" }} />

            {/* ── Progress line + step list ── */}
            <div className="flex flex-col gap-3">
              <p className="text-label font-medium" style={{ color: "var(--foreground)" }}>
                {summaryReady
                  ? t("creator.phase2.clarifier.allQuestionsAnsweredCount", { count: totalQuestions })
                  : t("creator.phase2.clarifier.progressTitle", { current: currentQuestion, total: totalQuestions })}
              </p>
              <ClarifierStepList
                answers={answers}
                currentQuestion={currentQuestion}
                stepLabels={stepLabels}
                disabled={isTyping || finalizing}
                onSaveFields={handleSaveFields}
              />
            </div>

            {/* ── Idea Journal ── */}
            <div
              className="mt-auto rounded-xl border p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}
            >
              <span className="text-badge font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                {t("creator.phase2.clarifier.ideaJournal")}
              </span>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-caption leading-relaxed line-clamp-4 font-sans" style={{ color: "var(--muted-foreground)" }}>
                  {journalText || t("creator.phase2.clarifier.journalDefault")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
