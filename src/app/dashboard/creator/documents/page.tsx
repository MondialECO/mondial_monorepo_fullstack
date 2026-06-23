'use client';

import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ShieldAlert, Download, Sparkles } from 'lucide-react';
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import type { CreatorDocument } from '@/types/creator/creator-journey';

interface DocItem {
  name: string;
  category: string;
  size: string;
  date: string;
  unlocked: boolean;
}

export default function CreatorDocumentsPage() {
  const router = useRouter();
  const { state } = useCreatorProgress();
  const { journeyState } = state;

  const isPhase3Complete = journeyState.phase3.status === 'completed';
  const isPhase6Complete = journeyState.phase6.status === 'completed';
  const savedPhase3Documents = state.documents.filter((doc: CreatorDocument) => doc.phase === 3);
  const phase3FallbackDocuments: DocItem[] = [
    {
      name: "B2B_SaaS_Business_Plan.pdf",
      category: "Strategic Plan",
      size: "240 KB",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      unlocked: isPhase3Complete || journeyState.phase3.currentStep > 3
    },
    {
      name: "3_Year_Financial_Forecast.xlsx",
      category: "Financial Model",
      size: "1.2 MB",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      unlocked: isPhase3Complete || journeyState.phase3.currentStep > 2
    },
    {
      name: "Articles_of_Incorporation_Delaware.pdf",
      category: "Legal Registry",
      size: "185 KB",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      unlocked: isPhase3Complete || journeyState.phase3.currentStep > 4
    },
  ];

  const documentsList: DocItem[] = [
    ...(savedPhase3Documents.length > 0
      ? savedPhase3Documents.map((doc) => ({
          name: doc.name,
          category: doc.category,
          size: doc.size,
          date: new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          unlocked: true,
        }))
      : phase3FallbackDocuments),
    {
      name: "Standard_Mutual_NDA_BAS.pdf",
      category: "NDA Agreement",
      size: "95 KB",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      unlocked: isPhase6Complete || journeyState.phase6.currentStep > 1
    }
  ];

  const unlockedCount = documentsList.filter(d => d.unlocked).length;

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            Document Vault
          </h1>
          <p className="text-sm font-normal text-muted-foreground">
            Review and download strategic, financial, and legal incorporation documents.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-0 font-bold text-xs px-3 py-1 self-start sm:self-center">
          {unlockedCount} of {documentsList.length} Vault files unlocked
        </Badge>
      </div>

      {unlockedCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentsList.map((doc, idx) => (
            <Card key={idx} className={`rounded-xl border border-border bg-card p-4 flex items-center justify-between transition-all ${!doc.unlocked ? 'opacity-50 select-none' : 'hover:border-primary/20 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">{doc.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                    <span>{doc.category}</span>
                    <span>/</span>
                    <span>{doc.size}</span>
                    {doc.unlocked && (
                      <>
                        <span>/</span>
                        <span>{doc.date}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {doc.unlocked ? (
                <Button size="icon" variant="ghost" aria-label="Download" className="rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground">
                  <Download className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider pr-2">
                  <ShieldAlert className="w-3.5 h-3.5" /> Locked
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-border bg-card p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">Document Vault Empty</CardTitle>
            <CardDescription className="text-sm max-w-sm">
              Your business canvas plans, runway spreadsheets, and formation documents will be vaulted here as you complete the steps in Phase 3.
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/dashboard/creator')} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl px-6">
            <Sparkles className="w-4 h-4 mr-1.5" /> Go to Creator Dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}
