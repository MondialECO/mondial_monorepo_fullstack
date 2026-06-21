'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Send, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';

export default function BusinessPlanGeneratorPage() {
  const router = useRouter();
  const { state, updateProject, saveOutputVersion, upsertDocument, completeStep } = useCreatorProgress();
  const project = state.project;

  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Hello! I can help customize your business canvas. Ask me to change pricing models, adjust marketing hooks, or add competitor strategies!' }
  ]);

  const [aiSuggestions, setAiSuggestions] = useState({
    executiveSummary: project.concept || 'AI Invoice Assistant automates receipt validation and payment routing for South Asian SMEs. By utilizing lightweight OCR models, it cuts processing costs by 80% compared to traditional bookkeeping.',
    marketGap: 'Canva and other general tools do not handle specialized transactional flows. Current invoicing systems require manual accounting reconciliation. We bridge this with instant ledger mapping.',
    revenueModel: 'Freemium SaaS: Free tier up to 50 invoices/month. Professional tier at $15/month for unlimited volumes. B2B telecommunication partnerships for reseller scaling.',
  });

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatLog((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsRefining(true);

    setTimeout(() => {
      let aiText = 'I have adjusted the strategy recommendation based on your prompt. Feel free to review the changes in the editing forms!';
      if (userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('pricing')) {
        setAiSuggestions((prev) => ({
          ...prev,
          revenueModel: 'Freemium SaaS with custom enterprise tier starting at $99/month, incorporating volume discounts and premium API integrations.'
        }));
        aiText = 'Sure! I have updated the pricing and revenue model suggestions. Take a look at the Revenue Model box!';
      } else if (userMsg.toLowerCase().includes('competitor') || userMsg.toLowerCase().includes('gap')) {
        setAiSuggestions((prev) => ({
          ...prev,
          marketGap: 'Most local legacy accounting tools require manual input. Custom local OCR engines are too expensive for micro-merchants. We provide micro-OCR capabilities.'
        }));
        aiText = 'I have refined the Market Gap statement to emphasize micro-OCR capabilities and micro-merchants.';
      }

      setChatLog((prev) => [...prev, { sender: 'ai', text: aiText }]);
      setIsRefining(false);
    }, 1200);
  };

  const handleNext = () => {
    updateProject({
      concept: aiSuggestions.executiveSummary,
      marketGap: aiSuggestions.marketGap,
    });
    saveOutputVersion('businessPlanVersions', {
      title: 'AI Business Plan Canvas',
      projectName: project.name || 'Untitled project',
      sections: aiSuggestions,
      chatLog,
    });
    upsertDocument({
      id: 'phase3-business-plan',
      name: 'B2B_SaaS_Business_Plan.pdf',
      category: 'Strategic Plan',
      size: '240 KB',
      phase: 3,
      step: 3,
      outputKey: 'businessPlanVersions',
    });
    completeStep(3, 3); // Step 3.3: Business Plan
    router.push('/dashboard/creator/phase-3/compliance');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.3"
      title="AI Business Plan Canvas"
      description="AI has drafted your initial business canvas. Edit sections manually or ask the AI assistant to refine them."
      stepLabel="Phase 3 Step 3 of 6"
      progress={50}
    >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Editor Form Columns */}
          <Card className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-primary" /> Strategic Pillars
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <RefreshCw className="w-3 h-3 mr-1" /> Re-Draft
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Executive Summary</label>
                  <Textarea
                    value={aiSuggestions.executiveSummary}
                    onChange={(e) => setAiSuggestions({ ...aiSuggestions, executiveSummary: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-muted/15 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Core Problem & Market Gap</label>
                  <Textarea
                    value={aiSuggestions.marketGap}
                    onChange={(e) => setAiSuggestions({ ...aiSuggestions, marketGap: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted/15 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Revenue Model & Monetization</label>
                  <Textarea
                    value={aiSuggestions.revenueModel}
                    onChange={(e) => setAiSuggestions({ ...aiSuggestions, revenueModel: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted/15 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/60">
              <Button variant="outline" className="rounded-xl font-bold text-xs">Save Canvas Draft</Button>
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 py-4 px-5">
                Proceed to Compliance <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* AI Chat Helper */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">AI Masterplan Assistant</h4>
                  <p className="text-[9px] text-muted-foreground">Adjust pricing & strategic models in real-time</p>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-xl border border-border/80 text-[11px] min-h-[220px] max-h-[300px]">
                {chatLog.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-2xl font-medium leading-relaxed max-w-[85%] ${chat.sender === 'ai'
                        ? 'bg-muted border border-border/60 text-muted-foreground rounded-tl-none mr-auto'
                        : 'bg-primary text-primary-foreground rounded-tr-none ml-auto'
                      }`}
                  >
                    {chat.text}
                  </div>
                ))}
                {isRefining && (
                  <div className="bg-muted text-muted-foreground px-3 py-2 rounded-2xl rounded-tl-none font-medium mr-auto animate-pulse">
                    AI is writing...
                  </div>
                )}
              </div>
            </div>

            {/* Input Form */}
            <div className="flex gap-2 pt-3 border-t border-border/50">
              <Input
                placeholder="Ask AI to refine plan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
              />
              <Button size="icon" onClick={handleSendChat} className="rounded-xl bg-primary text-primary-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        </div>
    </Phase3SetupShell>
  );
}
