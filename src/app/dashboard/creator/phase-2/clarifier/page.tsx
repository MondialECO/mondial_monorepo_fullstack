"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Check, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { isTerminalStatus, hasAiOutput } from "@/types/creator/ai";
// ONE shared poll policy (audit R12) — never redefine these locally.
import { POLL_INTERVAL_MS as POLL_MS, POLL_MAX_ATTEMPTS, POLL_MAX_MS } from "@/hooks/queries/creator-ai";

type ChatMsg = { id: string; sender: "ai" | "user"; text: string };

const TOTAL_QUESTIONS = 6;

const BLOCKS = [
  { title: "Core Problem", unlockAt: 1 },
  { title: "Target User", unlockAt: 2 },
  { title: "Market Gap", unlockAt: 3 },
  { title: "Solution", unlockAt: 4 },
  { title: "Your Edge", unlockAt: 5 },
];

export default function ClarifierChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [clarityScore, setClarityScore] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted transcript from the backend journey (resume-after-abandon).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        if (!active) return;
        const existing: ChatMsg[] = (journey.phase2Data?.chatMessages ?? []).map((m) => ({
          id: m.id, sender: m.sender, text: m.text,
        }));
        if (existing.length === 0) {
          existing.push({ id: "seed", sender: "ai", text: "In one sentence, what problem are you solving?" });
        }
        setMessages(existing);
        setQuestionIndex(existing.filter((m) => m.sender === "user").length);
        setClarityScore(journey.project?.clarityScore ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load your conversation.");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // After the 6th answer: start the real C-2 session from the collected answers,
  // poll to terminal (hard cap), then finalize → map output → summary.
  const runClarifier = useCallback(async (collected: ChatMsg[]) => {
    setFinalizing(true);
    setError(null);
    try {
      const answers = collected.filter((m) => m.sender === "user").map((m) => m.text);
      const start = await creatorAiApi.startClarifier({
        rawIdea: {
          title: answers[0]?.slice(0, 60) || "My idea",
          problemStatement: answers[0] || "",
          targetAudience: answers[1] || "",
          existingAlternatives: answers[2] || "",
          description: [answers[3], answers[4], answers[5]].filter(Boolean).join(" — "),
        },
      });

      let attempts = 0;
      const startedAt = Date.now();
      for (;;) {
        // Shared R12 policy: cap on attempts OR wall-clock, whichever first.
        if (attempts++ >= POLL_MAX_ATTEMPTS || Date.now() - startedAt >= POLL_MAX_MS)
          throw new Error("The clarifier took too long. Please retry.");
        await new Promise((r) => setTimeout(r, POLL_MS));
        const session = await creatorAiApi.getClarifier(start.sessionId);
        if (isTerminalStatus(session.status)) {
          if (session.status === "Failed" && !hasAiOutput(session.status)) {
            throw new Error(session.error || "The clarifier failed. Please retry.");
          }
          break;
        }
      }

      const result = await creatorJourneyApi.finalizeClarifier(start.sessionId);
      setClarityScore(result.clarityScore);
      router.push(`/dashboard/creator/phase-2/idea-summary${result.aiParseFailed ? "?review=1" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong finalizing your idea.");
      setFinalizing(false);
    }
  }, [router]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || finalizing) return;
    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, sender: "user", text }]);
    setDraft("");
    try {
      const res = await creatorJourneyApi.chatMessage(text);
      const mapped: ChatMsg[] = res.messages.map((m) => ({ id: m.id, sender: m.sender, text: m.text }));
      setMessages(mapped);
      setQuestionIndex(res.questionIndex);
      if (res.summaryReady) await runClarifier(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  };

  const clarityLabel = clarityScore >= 75 ? "Sharp" : clarityScore >= 55 ? "Developing" : "Vague";

  return (
    <div className="w-full min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> AI Idea Clarifier
        </div>
      </header>

      <div className="flex items-center justify-center gap-2 py-4">
        {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < questionIndex ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-6 max-w-6xl mx-auto w-full">
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh]">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {finalizing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Building your clarified summary…
              </div>
            )}
          </div>

          {error && <div className="px-5 py-2 text-xs text-destructive border-t border-border">{error}</div>}

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Type your answer…"
              aria-label="Message"
              disabled={sending || finalizing}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
            <Button onClick={handleSend} disabled={sending || finalizing || !draft.trim()} aria-label="Send message" className="rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Clarity Score</div>
            <div className="text-4xl font-extrabold text-primary">{clarityScore}</div>
            <div className="text-xs text-muted-foreground mt-1">{clarityLabel}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Building Blocks</div>
            {BLOCKS.map((b) => {
              const unlocked = questionIndex >= b.unlockAt;
              return (
                <div key={b.title} className="flex items-center gap-2 text-sm">
                  {unlocked ? <Check className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                  <span className={unlocked ? "text-foreground" : "text-muted-foreground"}>{b.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
