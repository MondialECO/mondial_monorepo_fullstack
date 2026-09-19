'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExtendedLegalChecklistItem } from '@/lib/api-creator-journey';

interface LegalAiGuideRailProps {
  selectedItem: ExtendedLegalChecklistItem | null;
  detectedArchetypes: string[];
  className?: string;
}

export function LegalAiGuideRail({
  selectedItem,
  detectedArchetypes,
  className,
}: LegalAiGuideRailProps) {
  const [activeTab, setActiveTab] = useState<'explanation' | 'actions'>('explanation');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!selectedItem) {
    return (
      <aside
        aria-label="MBC Legal Guide"
        className={cn(
          'w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-card/60 border border-border/70 rounded-2xl p-5 shadow-sm',
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">MBC Legal Guide</h3>
          <Badge variant="outline" className="text-[10px] ml-auto font-mono py-0 text-muted-foreground border-border">
            Guidance
          </Badge>
        </div>

        <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-2 bg-muted/10 my-auto">
          <BookOpen className="w-6 h-6 text-muted-foreground/40 mx-auto" />
          <h4 className="text-xs font-bold text-foreground">Select a Requirement</h4>
          <p className="text-caption text-muted-foreground leading-relaxed">
            Click on any French legal milestone from the center canvas to view tailored guidance and official citations.
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground/70 text-center border-t border-border/40 pt-2">
          MBC provides planning guidance and does not replace professional French legal counsel.
        </p>
      </aside>
    );
  }

  // Curated deterministic guidance blocks mapped to statutory requirements
  const getRequirementGuidance = (item: ExtendedLegalChecklistItem) => {
    const id = (item.ruleId || item.id || '').toUpperCase();

    if (id.includes('DATA') || id.includes('RGPD') || id.includes('PRIVACY')) {
      return {
        plainExplanation:
          'Under the European General Data Protection Regulation (GDPR), every company processing personal information of EU residents must guarantee data security, purpose limitation, and user rights.',
        keySteps: [
          'Document all personal data collected (emails, names, IP addresses) in a register.',
          'Publish a clear Privacy Policy detailing user rights (access, erasure, portability).',
          'Ensure third-party processors (hosting, analytics, CRM) execute a valid Data Processing Agreement (DPA).',
        ],
        faq: [
          {
            q: 'Does this apply if I am pre-revenue?',
            a: 'Yes. As soon as you collect early email signups or create user accounts, GDPR applies in France regardless of revenue.',
          },
          {
            q: 'Do I need a Data Protection Officer (DPO)?',
            a: 'Generally no for early-stage startups, unless processing sensitive health/biometric data or large-scale systematic monitoring.',
          },
        ],
      };
    }

    if (id.includes('COMM') || id.includes('CGV') || id.includes('SALE')) {
      return {
        plainExplanation:
          'General Terms of Sale (CGV) establish the legal framework for transactions, defining payment terms, delivery terms, and consumer protection rights under French commercial law.',
        keySteps: [
          'Draft clear Terms of Sale specifying pricing in Euros including all statutory taxes (TTC for B2C).',
          'Include the mandatory 14-day statutory withdrawal period for consumer transactions.',
          'Implement the 3-click cancellation mechanism if you provide ongoing digital subscriptions.',
        ],
        faq: [
          {
            q: 'Can I copy CGVs from another French startup?',
            a: 'Copying competitors’ CGVs is considered copyright infringement and unfair competition under French case law. Customization is required.',
          },
          {
            q: 'Are B2B CGVs mandatory?',
            a: 'In B2B, CGVs must be communicated to any professional buyer upon request (Article L441-1 of the French Commercial Code).',
          },
        ],
      };
    }

    if (id.includes('CORP') || id.includes('STATUT') || id.includes('IMMAT')) {
      return {
        plainExplanation:
          'In France, all commercial companies must deposit share capital, formalize bylaws (statuts), publish a legal notice, and register via the INPI Guichet Unique to obtain a Siren/Siret number and Kbis extract.',
        keySteps: [
          'Draft initial bylaws defining corporate governance and shareholding split.',
          'Deposit share capital into an escrow bank account or notaire to receive the deposit certificate.',
          'Submit the final file through formalites.entreprises.gouv.fr (Guichet Unique).',
        ],
        faq: [
          {
            q: 'How long does company immatriculation take?',
            a: 'Usually between 3 to 10 business days once complete documentation and capital deposit certificates are submitted.',
          },
          {
            q: 'What is the minimum capital required for a SAS / SASU?',
            a: 'The statutory minimum is 1 Euro, though depositing realistic working capital (e.g. 1,000€) establishes initial business credibility.',
          },
        ],
      };
    }

    // Default guidance
    return {
      plainExplanation:
        item.whyItApplies ||
        'This statutory French requirement applies based on your active business model, jurisdiction, and operational profile.',
      keySteps: [
        'Review the official French authority documentation linked below.',
        'Collect and prepare the required administrative or contractual proof.',
        'Mark the milestone as completed once verified by your founding team.',
      ],
      faq: [
        {
          q: 'Why was this identified for my business?',
          a: `MBC detected that your business exhibits characteristics (${detectedArchetypes.join(', ')}) that trigger this statutory provision in France.`,
        },
      ],
    };
  };

  const guidance = getRequirementGuidance(selectedItem);

  return (
    <aside
      aria-label="MBC Legal Guide"
      className={cn(
        'w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-card/60 border border-border/70 rounded-2xl p-4 shadow-sm',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">MBC Legal Guide</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground border-border">
          Guidance
        </Badge>
      </div>

      {/* Selected Item Headline */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Contextual Assistance
        </span>
        <h4 className="text-xs font-bold text-foreground line-clamp-1">
          {selectedItem.title || selectedItem.label}
        </h4>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-muted/40 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('explanation')}
          className={cn(
            'flex-1 py-1 px-2 rounded-md font-medium transition-colors text-center',
            activeTab === 'explanation' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Plain Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={cn(
            'flex-1 py-1 px-2 rounded-md font-medium transition-colors text-center',
            activeTab === 'actions' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Action Checklist
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5 text-xs">
        {activeTab === 'explanation' ? (
          <>
            <div className="space-y-1.5 leading-relaxed bg-muted/20 border border-border/40 p-3 rounded-xl">
              <p className="text-foreground">{guidance.plainExplanation}</p>
            </div>

            {/* Official Source Reference */}
            {selectedItem.officialSource && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Official Public Citation
                </span>
                <p className="font-semibold text-foreground text-xs">
                  {selectedItem.officialSource.authority}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {selectedItem.officialSource.title}
                </p>
              </div>
            )}

            {/* Quick FAQs */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Frequently Asked Questions
              </span>
              {guidance.faq.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="border border-border/60 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full text-left p-2.5 flex items-center justify-between gap-2 font-semibold text-foreground text-[11px] hover:bg-muted/30"
                    >
                      <span className="leading-snug">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-2.5 pt-0 text-[11px] text-muted-foreground leading-relaxed bg-muted/10 border-t border-border/40">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Key Recommended Steps
            </span>
            <ul className="space-y-2">
              {guidance.keySteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40 text-[11px] leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Persistent Non-Legal Advice Footer Disclaimer */}
      <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground text-center leading-snug">
        MBC provides planning guidance and does not replace professional legal advice.
      </div>
    </aside>
  );
}
