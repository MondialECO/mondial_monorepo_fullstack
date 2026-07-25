"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

// Right-panel step labels, derived from the backend's six scripted questions
// (CreatorPhase2Controller.Questions), in order.
const STEP_LABELS = [
  "Problem",
  "Target Users",
  "Alternatives",
  "Solution",
  "Differentiation",
  "Key Risk",
];

// Progress bands for the clarity ring. The ring fills from questions ANSWERED, not
// idea quality — so labels describe progress (grey → amber → blue → green) and the
// six-answer state says "All Answered", never "Complete": finalize is still required.
function ringBand(answered: number, total: number): { label: string; color: string } {
  if (answered <= 0) return { label: "Not Started", color: "var(--muted-foreground)" };
  if (answered <= 2) return { label: "Getting Started", color: "var(--dr-yellow)" };
  if (answered <= 4) return { label: "Developing", color: "var(--dr-yellow)" };
  if (answered < total) return { label: "Almost There", color: "var(--primary)" };
  return { label: "All Answered", color: "var(--p8-green)" };
}

export default function AIClarifierPage() {
  const router = useRouter();
  const { state, setState, refetch } = useCreatorProgress();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [ideaScore, setIdeaScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(TOTAL_QUESTIONS);
  const [summaryReady, setSummaryReady] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeSlow, setFinalizeSlow] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Index into `messages` of the user answer being edited in place (null = not editing).
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    // ── Edit-in-place branch ──
    // Update the answer at editingIndex instead of appending a new turn, then re-derive
    // the journal + project mirror. NO backend call: the backend keeps the original text
    // (chat-message is append-only). Acceptable because the follow-up questions are a
    // fixed server script (not content-dependent) and finalize builds rawIdea from these
    // frontend `messages`; the durable backend-synced edit is filed as CI-13. Runs before
    // the guard below so an answer can still be revised once summaryReady (issue 1).
    if (editingIndex !== null) {
      const editText = inputValue.trim();
      if (!editText) return; // empty/whitespace while editing → no-op, edit stays active
      const target = messages[editingIndex];
      if (!target || target.sender !== "user") {
        setEditingIndex(null);
        return;
      }

      const editedMessages = messages.map((m, i) => (i === editingIndex ? { ...m, text: editText } : m));
      setMessages(editedMessages);

      // 1-based ordinal of this answer among user turns → its journal/project slot
      // (answer N maps to canvasBlocks[N-1]; answer 6 "Key Risk" maps to no block).
      const answerOrdinal = editedMessages.slice(0, editingIndex + 1).filter((m) => m.sender === "user").length;
      if (answerOrdinal === 1) setJournalText(editText);
      const blockKey = canvasBlocks[answerOrdinal - 1]?.key;
      setCanvasBlocks((prev) =>
        prev.map((block, i) =>
          i === answerOrdinal - 1
            ? { ...block, value: editText.length > 30 ? editText.substring(0, 28) + "..." : editText }
            : block
        )
      );
      setState((prev) => ({
        ...prev,
        project: blockKey ? { ...prev.project, [blockKey]: editText, exists: true } : prev.project,
        journeyState: {
          ...prev.journeyState,
          phase2: { ...prev.journeyState.phase2, chatMessages: editedMessages },
        },
      }));

      setEditingIndex(null);
      setInputValue("");
      return;
    }

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
      setTotalQuestions(res.totalQuestions);
      setIdeaScore(Math.min(Math.round((res.questionIndex / res.totalQuestions) * 100), 100));
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

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — silently no-op.
    }
  };

  // Enter edit-in-place for a user answer: pull its text into the input and mark the
  // index. handleSend's edit branch (stage 3) updates in place instead of appending.
  const handleEditStart = (index: number) => {
    if (isTyping || finalizing) return;
    setInputValue(messages[index].text);
    setEditingIndex(index);
    setCopiedId(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
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

  // Derived progress — driven by answered count so the panel is independent of the
  // in-flight optimistic step. Kept for the ring, band and step list (stage 2).
  const answeredCount = messages.filter((m) => m.sender === "user").length;
  const ringPct = Math.min(Math.round((answeredCount / totalQuestions) * 100), 100);
  const band = ringBand(answeredCount, totalQuestions);
  const currentQuestion = Math.min(answeredCount + 1, totalQuestions);
  const ringR = 52;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - ringPct / 100);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8 sm:py-10 space-y-6">

        {/* ── Heading block ── */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
            Let&apos;s sharpen your idea
          </h1>
          <p className="text-base max-w-[780px]" style={{ color: "var(--muted-foreground)" }}>
            Answer {totalQuestions} focused questions. Our AI will analyze your responses and build your concept canvas.
          </p>
        </div>

        {/* ── Two columns (stack below lg) ──
            Cards: lit white edge (--card-edge) so they read as raised on the darker
            page, plus shadow-sm — a Tailwind default that deliberately approximates
            the design's softer 0 0 22px ambient glow (project uses default shadows). */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">

          {/* LEFT: conversation card */}
          <section
            className="w-full lg:flex-1 rounded-2xl border shadow-sm p-5 flex flex-col min-w-0"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
          >
            {/* ── Assistant header ── */}
            <div className="flex items-center gap-3 shrink-0">
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
                  alt="AI assistant"
                  width={30}
                  height={25}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                  AI Idea Clarifier
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {totalQuestions} focused questions to sharpen your idea
                </p>
              </div>
            </div>

            {/* ── Transcript surface — scrolls within its own bounds ──
                DELIBERATE deviation: fixed height, not flex-to-fill like the design.
                Flexing would couple the row height to the viewport (reintroducing the
                stage-1 pin) and to the chrome's topbar/footer heights; a predictable
                scroll container is worth more than matching the flex. Dead space in the
                shorter column is absorbed by the journal card (stage 6, mt-auto). */}
            <div
              className="mt-4 flex-1 min-h-0 rounded-2xl border overflow-hidden"
              style={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}
            >
              <div
                className="h-[420px] sm:h-[550px] overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]"
              >
                {messages.map((msg, index) => {
                  const isUser = msg.sender === "user";
                  // Send-failure notes are pushed as ai-sender messages with an "err-" id
                  // (handleSend rollback). Flag them for destructive styling — no logic change.
                  const isError = msg.id.startsWith("err-");
                  const isEditing = isUser && editingIndex === index;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* "Editing" tag on the answer currently pulled into the input */}
                      {isEditing && (
                        <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                          Editing…
                        </span>
                      )}
                      {/* Assistant and user bubbles share bg/border/radius by design —
                          they differ only by alignment and max width. Off-screen speaker
                          label distinguishes them for assistive tech. The answer being
                          edited gets a --primary border to tie it to the input below. */}
                      <div
                        className={`rounded-2xl border px-[18px] py-[14px] text-sm leading-relaxed ${isUser ? "max-w-[548px]" : "max-w-[580px]"}`}
                        style={{
                          backgroundColor: isError ? "color-mix(in srgb, var(--destructive) 8%, transparent)" : "var(--card)",
                          borderColor: isEditing ? "var(--primary)" : isError ? "var(--destructive)" : "var(--border)",
                          color: isError ? "var(--destructive)" : "var(--foreground)",
                        }}
                      >
                        <span className="sr-only">{isError ? "Error: " : isUser ? "You: " : "Assistant: "}</span>
                        {msg.text}
                      </div>

                      {/* Edit-in-place + copy actions on user messages. Edit populates
                          the input and marks this index; gated on !isTyping && !finalizing
                          (no summaryReady gate — editing before finalize is the key case).
                          Hidden on the message currently being edited (it's in the input). */}
                      {isUser && !isEditing && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => handleEditStart(index)}
                            disabled={isTyping || finalizing}
                            aria-label="Edit your answer"
                            className="inline-flex items-center text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: "var(--muted-foreground)" }}
                            onMouseEnter={(e) => { if (!isTyping && !finalizing) e.currentTarget.style.color = "var(--foreground)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            aria-label="Copy your answer"
                            className="inline-flex items-center gap-1 text-[11px] transition-colors"
                            style={{ color: copiedId === msg.id ? "var(--p8-green)" : "var(--muted-foreground)" }}
                            onMouseEnter={(e) => { if (copiedId !== msg.id) e.currentTarget.style.color = "var(--foreground)"; }}
                            onMouseLeave={(e) => { if (copiedId !== msg.id) e.currentTarget.style.color = "var(--muted-foreground)"; }}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="h-4 w-4" /> Copied
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

                {/* Thinking indicator — assistant working on the next question */}
                {isTyping && (
                  <div className="flex flex-col items-start">
                    <div
                      className="rounded-2xl border px-[18px] py-[14px] max-w-[580px] flex items-center gap-2"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <span className="sr-only">Assistant is typing</span>
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--primary)" }} />
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Thinking…
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ── Input row + keyboard hint ──
                Renders while questions remain OR while editing — editing takes precedence
                so an answer can be revised even after all six are answered (issue 1). Once
                not editing and summaryReady, the finalize states below render instead. */}
            {editingIndex !== null || !summaryReady ? (
              <div className="mt-4 shrink-0">
                {editingIndex !== null && (
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                      Editing your answer
                    </span>
                    <button
                      onClick={handleEditCancel}
                      className="inline-flex items-center gap-1 text-[11px] transition-colors"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                )}
                <div
                  className="flex items-end gap-2 rounded-xl border p-1.5 focus-within:ring-1 focus-within:ring-[var(--ring)] transition-shadow"
                  style={{ backgroundColor: "var(--popover)", borderColor: editingIndex !== null ? "var(--primary)" : "var(--border)" }}
                >
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={editingIndex !== null ? "Revise your answer..." : "Type your answer..."}
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 resize-none bg-transparent outline-none border-none px-3 py-2.5 text-sm min-h-[40px] max-h-[120px] placeholder:text-muted-foreground"
                    style={{ color: "var(--foreground)" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    aria-label={editingIndex !== null ? "Save edit" : "Send answer"}
                    className="flex items-center justify-center rounded-lg shrink-0 transition-opacity disabled:opacity-50"
                    style={{ width: 44, height: 44, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {isTyping ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : editingIndex !== null ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {editingIndex !== null
                    ? "Press Enter to save your edit"
                    : "Press Enter to send  Shift + Enter for new line"}
                </p>
              </div>
            ) : finalizeError ? (
              /* FINALIZE ERROR — retry is always possible; the six answers stay in
                 messages/state (finalize failure never clears them), so nothing is lost. */
              <div
                className="mt-4 shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "color-mix(in srgb, var(--destructive) 12%, transparent)" }}
                >
                  <X className="h-5 w-5" strokeWidth={3} style={{ color: "var(--destructive)" }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    We couldn&apos;t finish that
                  </h3>
                  <p className="text-xs max-w-xs" style={{ color: "var(--destructive)" }}>
                    {finalizeError}
                  </p>
                  <p className="text-[11px] max-w-xs mx-auto" style={{ color: "var(--muted-foreground)" }}>
                    Your answers are saved — nothing was lost. You can try again.
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  Try again <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : finalizing ? (
              /* FINALIZING — the AI clarifier is running + being polled. */
              <div
                className="mt-4 shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "var(--muted)" }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--muted-foreground)" }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Clarifying your idea…
                </h3>
                <p className="text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                  {finalizeSlow
                    ? "Still working — this is taking longer than usual. Hang tight."
                    : "Analyzing your answers and scoring clarity. This can take a moment."}
                </p>
              </div>
            ) : (
              /* FINALIZE CTA — replaces the input entirely; the action a user must take
                 or lose their work. Says what finalizing does, not just the button name. */
              <div
                className="mt-4 shrink-0 rounded-xl border p-5 flex flex-col items-center text-center gap-3"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--card-edge)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, backgroundColor: "var(--dr-bg-green)" }}
                >
                  <Check className="h-5 w-5" strokeWidth={3} style={{ color: "var(--p8-green)" }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    All questions answered
                  </h3>
                  <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--muted-foreground)" }}>
                    Finalizing runs the AI analysis to score your idea&apos;s clarity and build your
                    concept canvas, then takes you to your summary. You&apos;re not done until you do this.
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  Generate my summary <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* RIGHT: progress panel */}
          <aside
            className="w-full lg:w-[300px] rounded-2xl border shadow-sm px-6 pt-9 pb-6 flex flex-col gap-6 shrink-0"
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
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: band.color }}>
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
                  <p className="text-[11px] text-center" style={{ color: "var(--muted-foreground)" }}>
                    You&apos;re not done yet — finalize to save your clarity score.
                  </p>
                  <button
                    onClick={handleComplete}
                    disabled={finalizing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {finalizing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Finalizing…
                      </>
                    ) : (
                      <>
                        Generate my summary <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : answeredCount >= totalQuestions ? (
                <div className="w-full flex flex-col items-center gap-1.5 pt-1">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: band.color }} />
                  <p className="text-[11px] text-center" style={{ color: "var(--muted-foreground)" }}>
                    Saving your final answer…
                  </p>
                </div>
              ) : null}
            </div>

            {/* Divider — drawn as a 1px rule (the design exports it as an image) */}
            <div className="h-px w-full" style={{ backgroundColor: "var(--border)" }} />

            {/* ── Progress line + step list ── */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {summaryReady
                  ? `All ${totalQuestions} questions answered`
                  : `Progress: Question ${currentQuestion} of ${totalQuestions}`}
              </p>
              <div className="flex flex-col gap-2">
                {STEP_LABELS.map((label, idx) => {
                  const stepNum = idx + 1;
                  const done = answeredCount >= stepNum;
                  const current = !done && answeredCount === stepNum - 1;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      {/* status badge: tinted circle drawn separately; lucide supplies
                          the check glyph (design's filled tick-circle has no library
                          single-glyph equivalent) or the step number */}
                      <div
                        className="flex items-center justify-center rounded-full shrink-0"
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: done
                            ? "var(--dr-bg-green)"
                            : current
                              ? "var(--primary)"
                              : "var(--muted)",
                        }}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: "var(--p8-green)" }} />
                        ) : (
                          <span
                            className="text-[11px] leading-none"
                            style={{ color: current ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                          >
                            {stepNum}
                          </span>
                        )}
                      </div>
                      {/* label + parenthetical (future steps only; completed & current
                          drop it — a completed step relies on the tick) */}
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className={`text-xs ${current ? "font-medium" : ""}`}
                          style={{ color: "var(--foreground)" }}
                        >
                          {label}
                        </span>
                        {!done && !current && (
                          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                            (Unlocks after Q{stepNum - 1})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Idea Journal ──
                mt-auto pins it to the bottom so the right column fills its stretched
                height (equal to the taller left column, per items-stretch) with no dead
                space — the agreed fix for the fixed-transcript deviation. The content
                mirrors the first transcript answer and is redundant (CI-14), kept as-is. */}
            <div
              className="mt-auto rounded-xl border p-4 flex flex-col gap-2"
              style={{ backgroundColor: "var(--muted)", borderColor: "var(--border)" }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Idea Journal
              </span>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--muted-foreground)" }}>
                  {journalText}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
