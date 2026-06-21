"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, ArrowRight, Loader2, Check, MessageSquare, Lock, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type CanvasBlock = {
  title: string;
  value: string;
  unlockQ: number;
  key: string;
};

const QUESTIONS = [
  "",
  "Great choice! Tell me — what personally connects you to this problem? Have you experienced it yourself?",
  "Who do you imagine as your very first customer? Be as specific as possible — age, location, daily routine.",
  "What would make someone choose your solution over doing nothing or using an existing tool?",
  "If you had to launch in 3 months with $500, what's the one core thing you'd build first?",
  "How do you plan to reach your first 100 users without paid advertising?",
];

const COMPLETION_MSG =
  "Excellent. I have everything I need to build your complete Idea Summary. Your refined idea is ready for the next phase. Let's proceed! 🚀";

export default function AIChatPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [ideaScore, setIdeaScore] = useState(20);

  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    { title: "FOUNDER FIT", value: "", unlockQ: 2, key: "creatorEdge" },
    { title: "FIRST CUSTOMER", value: "", unlockQ: 3, key: "targetUser" },
    { title: "DIFFERENTIATION", value: "", unlockQ: 4, key: "marketGap" },
    { title: "MVP SCOPE", value: "", unlockQ: 5, key: "solution" },
    { title: "GO-TO-MARKET", value: "", unlockQ: 6, key: "gtm" },
  ]);

  const [journalText, setJournalText] = useState("Your personal context will appear here as you answer...");

  // Load chat history from global state
  useEffect(() => {
    const savedMessages = state.journeyState?.phase2?.chatMessages;
    // Check if we already have saved chat messages that start with discovery questions
    const isDiscoveryChat = savedMessages && savedMessages.length > 0 && 
      (savedMessages[0].text === QUESTIONS[1] || savedMessages.some(m => QUESTIONS.includes(m.text)));

    if (savedMessages && savedMessages.length > 0 && isDiscoveryChat) {
      setMessages(savedMessages);
      const userAnswersCount = savedMessages.filter(m => m.sender === "user").length;
      const step = userAnswersCount + 1;
      setCurrentStep(step);
      setIdeaScore(Math.min(step * 20, 100));

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
      const initialMsgs: Message[] = [{ id: "0", sender: "ai", text: QUESTIONS[1] }];
      setMessages(initialMsgs);
      setCurrentStep(1);
      setIdeaScore(20);
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
  }, [state.journeyState?.phase2?.chatMessages, setState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping || currentStep > 5) return;
    const userText = inputValue.trim();
    const newId = Date.now().toString();

    const updatedMessages = [...messages, { id: newId, sender: "user" as const, text: userText }];
    setMessages(updatedMessages);
    setInputValue("");

    // Update Project state
    const blockKey = canvasBlocks[currentStep - 1]?.key;
    const projectFieldsToUpdate: any = {};
    if (blockKey) {
      projectFieldsToUpdate[blockKey] = userText;
    }
    if (currentStep === 1) {
      setJournalText(userText);
    }

    setCanvasBlocks((prev) =>
      prev.map((block) =>
        block.unlockQ === currentStep + 1
          ? { ...block, value: userText.length > 30 ? userText.slice(0, 28) + "…" : userText }
          : block
      )
    );

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setIdeaScore(Math.min(nextStep * 20, 100));

    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        ...projectFieldsToUpdate,
        exists: true,
      },
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          chatMessages: updatedMessages,
        },
      },
    }));

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiText = nextStep <= 5 ? QUESTIONS[nextStep] : COMPLETION_MSG;
      const aiMsgId = (Date.now() + 1).toString();
      const finalMessages = [...updatedMessages, { id: aiMsgId, sender: "ai" as const, text: aiText }];
      setMessages(finalMessages);

      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: {
            ...prev.journeyState.phase2,
            chatMessages: finalMessages,
          },
        },
      }));
    }, 1400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isComplete = currentStep > 5;

  const handleComplete = () => {
    // Set dynamic score
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        clarityScore: 92,
        exists: true,
      },
    }));
    router.push("/dashboard/creator/phase-2/idea-summary");
  };

  return (
    <div className="w-full flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/idea-confirm")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Idea Deep Dive
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-[3px] w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(42 + (currentStep - 1) * 8, 80)}%` }}
        />
      </div>

      {/* Three-column layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-card w-full min-h-0">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-[220px] border-b md:border-b-0 md:border-r border-border p-5 flex flex-col gap-5 shrink-0 justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="line-through">Phase 1: Identity</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <span>Phase 2: Idea Deep Dive</span>
              <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto">active</span>
            </div>

            {["Concept & Name", "Logo & Branding", "AI Masterplan", "Offer Setup"].map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-muted shrink-0" />
                <span>Phase {i + 3}: {label}</span>
              </div>
            ))}
          </div>

          <div className="border border-dashed border-border rounded-2xl p-4 flex flex-col gap-2 min-h-[140px] bg-muted/30">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Idea Journal</span>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed break-words font-medium">{journalText}</p>
            </div>
          </div>
        </aside>

        {/* Chat Panel */}
        <section className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-border bg-card min-w-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-foreground truncate">AI Idea Deep Dive</h2>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  5 focused questions to lock in your project identity.
                </p>
              </div>
            </div>

            <div className="flex gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                    s < currentStep
                      ? "bg-primary"
                      : s === currentStep && !isComplete
                      ? "bg-primary animate-pulse"
                      : isComplete
                      ? "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 select-none">
                    M
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">M</div>
                <div className="p-3.5 rounded-2xl bg-muted rounded-tl-none border border-border flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">M is writing…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            {!isComplete ? (
              <>
                <div className="relative flex items-center border border-border rounded-2xl overflow-hidden focus-within:border-primary transition-all bg-card p-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer…"
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 resize-none border-none outline-none py-3 px-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground bg-transparent min-h-[44px] max-h-[120px]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center text-primary-foreground shrink-0 transition-all mr-1 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <span className="block text-[10px] text-center text-muted-foreground mt-2">Press Enter to send • Shift+Enter for new line</span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600">
                  <Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-foreground text-sm">Deep Dive Complete!</h3>
                <Button
                  onClick={handleComplete}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all text-xs shadow-sm cursor-pointer"
                >
                  View Idea Summary
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar — Canvas + Score */}
        <aside className="w-full md:w-[240px] p-5 flex flex-col items-center gap-5 shrink-0 overflow-y-auto bg-card">
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="5" className="text-muted" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - ideaScore / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-foreground">
                {ideaScore}<span className="text-[9px] font-semibold text-muted-foreground">/100</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Refining your idea</span>
          </div>

          <div className="w-full space-y-2.5">
            {canvasBlocks.map((block) => {
              const locked = currentStep < block.unlockQ;
              return (
                <div
                  key={block.key}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all duration-300 ${
                    locked
                      ? "border-border bg-muted/50 opacity-60"
                      : "border-primary/20 bg-primary/5 shadow-sm"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-foreground tracking-wide uppercase">{block.title}</span>
                    <span className={`block text-[10px] font-semibold mt-0.5 truncate max-w-[130px] ${locked ? "text-muted-foreground" : "text-primary"}`}>
                      {locked ? `Unlocks after Q${block.unlockQ - 1}` : block.value || "Filled ✓"}
                    </span>
                  </div>
                  {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
