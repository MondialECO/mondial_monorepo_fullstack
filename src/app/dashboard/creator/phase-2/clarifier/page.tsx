"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  Send,
  FileText,
  Sparkles,
  MessageSquare,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { isTerminalStatus } from "@/types/creator/ai";
import { toAiError } from "@/lib/ai-errors";
import {
  POLL_INTERVAL_MS as SHARED_POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS as SHARED_POLL_MAX_ATTEMPTS,
  POLL_MAX_MS,
} from "@/hooks/queries/creator-ai";

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type CanvasBlock = {
  title: string;
  unlockQ: number;
  value: string;
  key: string;
};

// The opener (first question) is shown client-side before the first turn; the
// backend chat-message endpoint drives every follow-up question and the
// completion line, so the rest of the script lives server-side (6 questions).
const OPENER =
  "Welcome. Tell me your idea — in your own words, however rough it is. What problem are you solving?";
const TOTAL_QUESTIONS = 6;
// TODO (R12-consolidation): Replace with shared POLL_INTERVAL_MS / POLL_MAX_ATTEMPTS from creator-ai.ts
// This page currently hardcodes 100 attempts (≈4.2min) instead of the canonical 60/3-min policy.
// New code (retry path, below) uses the shared policy; this will be fixed in a separate consolidation change.
const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 100;

export default function AIClarifierPage() {
  const router = useRouter();
  const { state, setState, refetch } = useCreatorProgress();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [ideaScore, setIdeaScore] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [summaryReady, setSummaryReady] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    { title: "CONCEPT", unlockQ: 2, value: "", key: "concept" },
    { title: "TARGET USER", unlockQ: 3, value: "", key: "targetUser" },
    { title: "CORE PROBLEM", unlockQ: 4, value: "", key: "problem" },
    { title: "YOUR SOLUTION", unlockQ: 5, value: "", key: "solution" },
    { title: "YOUR EDGE", unlockQ: 6, value: "", key: "creatorEdge" },
  ]);

  const [journalText, setJournalText] = useState("Your refined idea will be saved here automatically.");

  // Load chat history and current status from global state
  useEffect(() => {
    const savedMessages = state.journeyState?.phase2?.chatMessages;
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
      // Determine current step based on user answers
      const userAnswersCount = savedMessages.filter(m => m.sender === "user").length;
      const step = userAnswersCount + 1;
      setCurrentStep(step);
      setIdeaScore(Math.min((step - 1) * 20, 100));
      setSummaryReady(userAnswersCount >= TOTAL_QUESTIONS);

      // Re-populate canvas blocks from user answers
      const userMsgs = savedMessages.filter(m => m.sender === "user");
      if (userMsgs[0]) setJournalText(userMsgs[0].text);
      setCanvasBlocks((prev) =>
        prev.map((block, i) => {
          const answer = userMsgs[i]?.text;
          return {
            ...block,
            value: answer ? (answer.length > 30 ? answer.substring(0, 28) + "..." : answer) : "",
          };
        })
      );
    } else {
      // Initialize with the opener (follow-ups come from the backend).
      const initialMsgs: Message[] = [{ id: "1", sender: "ai", text: OPENER }];
      setMessages(initialMsgs);
      setCurrentStep(1);
      setIdeaScore(0);

      // Pre-seed from Discovery concept if available (cosmetic UX only, seed is not used for rawIdea creation)
      const selectedConceptId = state.journeyState?.phase2?.selectedConceptId;
      const concepts = state.journeyState?.phase2?.generatedConcepts ?? [];
      const discoveredConcept = concepts.find((c) => c.id === selectedConceptId);

      if (discoveredConcept) {
        // Pre-populate canvas blocks with concept fields for Discovery users
        const conceptData = {
          concept: discoveredConcept.concept || "",
          targetUser: discoveredConcept.targetUser || "",
          problem: discoveredConcept.coreProblem || "",
          solution: discoveredConcept.solution || "",
          creatorEdge: discoveredConcept.founderEdge || "",
        };
        setCanvasBlocks((prev) =>
          prev.map((block) => {
            const seedValue = conceptData[block.key as keyof typeof conceptData] || "";
            return {
              ...block,
              value: seedValue ? (seedValue.length > 30 ? seedValue.substring(0, 28) + "..." : seedValue) : "",
            };
          })
        );
        // Pre-fill journal with concept title
        if (discoveredConcept.title) setJournalText(discoveredConcept.title);
      }

      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: {
            ...prev.journeyState.phase2,
            chatMessages: initialMsgs,
          },
        },
      }));
    }
  }, [state.journeyState?.phase2?.chatMessages, state.journeyState?.phase2?.selectedConceptId, state.journeyState?.phase2?.generatedConcepts, setState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || summaryReady || finalizing) return;
    const userText = inputValue.trim();
    const userMsgId = Date.now().toString();
    const priorMessages = messages;

    // 1. Optimistically add the user message.
    const updatedMessages = [...messages, { id: userMsgId, sender: "user" as const, text: userText }];
    setMessages(updatedMessages);
    setInputValue("");

    // Mirror the answer onto the project + canvas preview.
    const blockKey = canvasBlocks[currentStep - 1]?.key;
    const projectFieldsToUpdate: Record<string, string> = {};
    if (blockKey) projectFieldsToUpdate[blockKey] = userText;
    if (currentStep === 1) setJournalText(userText);

    setCanvasBlocks((prev) =>
      prev.map((block) =>
        block.unlockQ === currentStep + 1
          ? { ...block, value: userText.length > 30 ? userText.substring(0, 28) + "..." : userText }
          : block
      )
    );

    setState((prev) => ({
      ...prev,
      project: { ...prev.project, ...projectFieldsToUpdate, exists: true },
      journeyState: {
        ...prev.journeyState,
        phase2: { ...prev.journeyState.phase2, chatMessages: updatedMessages },
      },
    }));

    // 2. Real AI turn — backend persists the transcript and returns the next question.
    setIsTyping(true);
    try {
      const res = await creatorJourneyApi.chatMessage(userText);
      const lastAi = [...res.messages].reverse().find((m) => m.sender === "ai");
      const aiText = lastAi?.text ?? "Thanks — let's continue.";
      const aiMsgId = (Date.now() + 1).toString();
      const finalMessages = [...updatedMessages, { id: aiMsgId, sender: "ai" as const, text: aiText }];
      setMessages(finalMessages);
      setCurrentStep(res.questionIndex + 1);
      setIdeaScore(Math.min(Math.round((res.questionIndex / TOTAL_QUESTIONS) * 100), 100));
      setSummaryReady(res.summaryReady);

      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: { ...prev.journeyState.phase2, chatMessages: finalMessages },
        },
      }));
    } catch (err) {
      // Roll back the optimistic turn, restore the draft, and surface the reason.
      const note: Message = { id: `err-${Date.now()}`, sender: "ai", text: toAiError(err).message };
      setMessages([...priorMessages, note]);
      setInputValue(userText);
      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: { ...prev.journeyState.phase2, chatMessages: priorMessages },
        },
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Poll the C-2 clarifier session until it reaches a terminal status.
  const pollClarifier = async (sessionId: string) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      const session = await creatorAiApi.getClarifier(sessionId);
      if (isTerminalStatus(session.status)) return session;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    return null;
  };

  // Poll for retry using the shared R12 timeout policy (60 attempts / 3 minutes wall-clock).
  // Used when aiParseFailed=true and user clicks "Try again" to start a fresh clarifier session.
  const pollClarifierWithR12 = async (sessionId: string) => {
    const startTime = Date.now();
    for (let i = 0; i < SHARED_POLL_MAX_ATTEMPTS; i++) {
      const session = await creatorAiApi.getClarifier(sessionId);
      if (isTerminalStatus(session.status)) return session;

      // Check wall-clock timeout (3 minutes)
      const elapsed = Date.now() - startTime;
      if (elapsed >= POLL_MAX_MS) return null;

      await new Promise((r) => setTimeout(r, SHARED_POLL_INTERVAL_MS));
    }
    return null;
  };

  const handleComplete = async () => {
    if (finalizing) return;
    setFinalizeError(null);
    setFinalizing(true);
    try {
      const answers = messages.filter((m) => m.sender === "user").map((m) => m.text);
      const rawIdea = {
        title: state.project?.name?.trim() || (answers[0]?.slice(0, 60) ?? "My idea"),
        problemStatement: answers[0] ?? "",
        targetAudience: answers[1] ?? "",
        description: answers[3] ?? answers[0] ?? "",
        existingAlternatives: answers[2] ?? "",
      };

      // Start the C-2 AI clarifier (1 credit), poll it, then map onto the project.
      const { sessionId } = await creatorAiApi.startClarifier({ rawIdea });
      const session = await pollClarifier(sessionId);
      if (!session) throw new Error("This is taking longer than expected. Please try again.");

      // finalize-clarifier is tolerant of a partial/failed output (falls back to a
      // 50 clarity score + editable summary), so we map on any terminal status.
      const result = await creatorJourneyApi.finalizeClarifier(sessionId);

      // Two distinct failure kinds — show an honest, specific message and allow retry.
      // Do NOT navigate or spread empty fields into state on either failure.
      if (result.aiRequestFailed) {
        // The AI service was unavailable (unreachable / rate-limited) — rewording won't help.
        setFinalizeError(
          "The AI service is temporarily unavailable. Please try again in a moment."
        );
        setFinalizing(false);
        return;
      }
      if (result.aiParseFailed) {
        // The AI replied but we couldn't interpret it — rewording the idea can help.
        setFinalizeError(
          "We couldn't interpret that just now. Please try again, or reword your idea and resubmit."
        );
        setFinalizing(false);
        return;
      }

      // Compute final values with proper fallbacks BEFORE spreading result.project
      const firstAnswer = answers[0]?.trim() || "";
      const clarityScoreFinal = Math.round(result.clarityScore ?? 50);
      const conceptFinal =
        (result.project?.concept as string) ||
        firstAnswer.slice(0, 100) ||
        "My Idea";

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

      // Navigate — idea-summary will show data from local state immediately
      router.push("/dashboard/creator/phase-2/idea-summary");
    } catch (err) {
      setFinalizeError(toAiError(err).message);
      setFinalizing(false);
    }
  };

  const unlockedCount = canvasBlocks.filter((b) => currentStep >= b.unlockQ).length;

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3 shrink-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/creator/phase-2")}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          <span className="hidden sm:inline">Phase 2 of 6 —</span> Refinement Chat
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div className="h-[3px] w-full bg-muted shrink-0">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.min(28 + (currentStep - 1) * 10, 78)}%` }}
        />
      </div>

      {/* ── THREE-COLUMN WORKSPACE ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ─── LEFT SIDEBAR (hidden below lg) ─── */}
        <aside className="hidden lg:flex w-[220px] border-r border-border flex-col justify-between p-5 bg-card shrink-0 overflow-y-auto">
          {/* Stepper */}
          <div className="space-y-1">
            {/* Phase 1 — done */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-medium text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="line-through">Phase 1: Identity & KYC</span>
            </div>

            {/* Phase 2 — active */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-primary/5 border border-primary/10 text-xs font-bold text-foreground">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <span className="flex-1">Phase 2: Refinement</span>
              <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                active
              </span>
            </div>

            {/* Phases 3-6 — locked */}
            {["Concept & Name", "Logo & Branding", "AI Masterplan", "Offer Setup"].map((phase, idx) => (
              <div
                key={phase}
                className="flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-medium text-muted-foreground"
              >
                <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>
                  Phase {idx + 3}: {phase}
                </span>
              </div>
            ))}
          </div>

          {/* Idea Journal */}
          <div className="border border-dashed border-border rounded-xl p-4 flex flex-col gap-3 bg-muted/30 mt-5">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
              Idea Journal
            </span>
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed break-words font-medium line-clamp-4">
                {journalText}
              </p>
            </div>
          </div>
        </aside>

        {/* ─── MIDDLE: CHAT PANEL (always visible, takes remaining space) ─── */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-card">
          {/* Chat header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-foreground truncate">AI Idea Clarifier</h2>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">
                  5 focused questions to sharpen your idea
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-3">
              {/* Step dots */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-4 h-1.5 rounded-full transition-colors duration-300 ${
                      step < currentStep
                        ? "bg-primary"
                        : step === currentStep && currentStep <= 5
                          ? "bg-primary animate-pulse"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Mobile: toggle right panel */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden flex items-center gap-1.5 text-xs h-8 px-2.5 rounded-lg"
                onClick={() => setShowRightPanel(true)}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="font-bold">{ideaScore}</span>
              </Button>
            </div>
          </div>

          {/* Chat messages — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-[88%] sm:max-w-[80%] animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm">
                    M
                  </div>
                )}
                <div
                  className={`px-4 py-3 text-[13px] sm:text-sm font-medium leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-sm"
                      : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-3 max-w-[80%] animate-in fade-in-0 duration-200">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm">
                  M
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted border border-border flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input — pinned bottom */}
          <div className="p-3 sm:p-4 border-t border-border bg-card shrink-0">
            {!summaryReady ? (
              <>
                <div className="relative flex items-end gap-2 border border-border rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-background p-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your answer..."
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 resize-none border-none outline-none py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent min-h-[40px] max-h-[120px]"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="w-9 h-9 rounded-lg shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <span className="block text-[10px] text-center text-muted-foreground mt-2">
                  Press Enter to send · Shift+Enter for new line
                </span>
              </>
            ) : finalizeError ? (
              /* ERROR + RETRY — never shown alongside the success header */
              <div className="w-full flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                  <X className="w-5 h-5" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-foreground text-sm">We couldn&apos;t finish that</h3>
                <p className="text-xs text-destructive max-w-xs">{finalizeError}</p>
                <Button
                  onClick={handleComplete}
                  disabled={finalizing}
                  className="font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs shadow-sm disabled:opacity-60"
                >
                  Try again
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : finalizing ? (
              /* PROCESSING — finalize in progress */
              <div className="w-full flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <h3 className="font-bold text-foreground text-sm">Clarifying your idea…</h3>
                <Button
                  disabled
                  className="font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs shadow-sm disabled:opacity-60"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your summary…
                </Button>
              </div>
            ) : (
              /* READY — chat complete, ready to finalize (navigates away on success) */
              <div className="w-full flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-foreground text-sm">Idea clarified — ready to continue</h3>
                <Button
                  onClick={handleComplete}
                  disabled={finalizing}
                  className="font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs shadow-sm disabled:opacity-60"
                >
                  Proceed to Concept &amp; Name
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ─── RIGHT SIDEBAR — desktop: always visible / mobile: slide-over ─── */}

        {/* Mobile overlay backdrop */}
        {showRightPanel && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in-0 duration-200"
            onClick={() => setShowRightPanel(false)}
          />
        )}

        <aside
          className={`
            ${showRightPanel ? "translate-x-0" : "translate-x-full"}
            lg:translate-x-0
            fixed right-0 top-0 bottom-0 z-50
            lg:static lg:z-auto
            w-[280px] lg:w-[260px]
            border-l border-border
            p-5 flex flex-col items-center gap-5
            bg-card shrink-0 overflow-y-auto
            transition-transform duration-300 ease-out
          `}
        >
          {/* Close button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden absolute top-3 right-3 h-8 w-8 rounded-lg"
            onClick={() => setShowRightPanel(false)}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Idea Score Ring */}
          <div className="flex flex-col items-center pt-2 lg:pt-0">
            <div className="relative w-28 h-28 flex items-center justify-center mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="text-muted"
                  strokeWidth="6"
                  fill="transparent"
                  stroke="currentColor"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="text-primary transition-all duration-700 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - ideaScore / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute text-lg font-extrabold text-foreground tabular-nums">
                {ideaScore}{" "}
                <span className="text-[10px] font-semibold text-muted-foreground">/ 100</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase text-center">
              Idea Score
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {unlockedCount}/5 blocks unlocked
            </span>
          </div>

          {/* Canvas Blocks */}
          <div className="w-full space-y-2.5">
            {canvasBlocks.map((block) => {
              const isLocked = currentStep < block.unlockQ;
              return (
                <div
                  key={block.title}
                  className={`border rounded-xl p-3.5 flex items-center justify-between transition-all duration-300 ${
                    isLocked
                      ? "bg-muted/40 border-border opacity-60"
                      : "bg-card border-primary/20 shadow-sm ring-1 ring-primary/5"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-foreground tracking-wide uppercase">
                      {block.title}
                    </span>
                    <span
                      className={`block text-xs font-semibold mt-0.5 truncate max-w-[160px] ${
                        isLocked ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {isLocked ? `Unlocks after Q${block.unlockQ - 1}` : block.value || "Filled ✓"}
                    </span>
                  </div>
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
