'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  Square,
  SquareCheckBig,
  WandSparkles,
  ShieldCheck,
  Building2,
  Lock,
  FileText,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { cn } from '@/lib/utils';
import {
  creatorJourneyApi,
  type LegalChecklist,
  type LegalChecklistItem,
  type ChecklistStatus,
} from '@/lib/api-creator-journey';

const NEXT_STATUS: Record<ChecklistStatus, ChecklistStatus> = {
  pending: 'done',
  in_progress: 'done',
  done: 'pending',
};

interface ItemMeta {
  groupId: 'corporate' | 'ip' | 'privacy' | 'regulatory';
  groupTitle: string;
  description: string;
  whyItMatters: string;
  marketplaceCategory?: string;
  marketplaceLabel?: string;
}

const LEGAL_ITEM_META: Record<string, ItemMeta> = {
  'company-type': {
    groupId: 'corporate',
    groupTitle: 'Corporate Governance & Structure',
    description: 'Select the optimal legal entity structure (SAS, SARL, SAS-U) aligned with founder liability, tax, and fundraising goals.',
    whyItMatters: 'Determines taxation, executive liability, and investor share issuance capacity in Step 3.6.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Formation Lawyers',
  },
  'bank-account': {
    groupId: 'corporate',
    groupTitle: 'Corporate Governance & Structure',
    description: 'Open a dedicated corporate business bank account and deposit initial share capital.',
    whyItMatters: 'Required by corporate registries to issue the certificate of incorporation (Kbis).',
  },
  'shareholder-agreement': {
    groupId: 'corporate',
    groupTitle: 'Corporate Governance & Structure',
    description: 'Draft shareholder agreement (pacte d’actionnaires) defining voting rights, vesting schedules, and transfer restrictions.',
    whyItMatters: 'Protects co-founders and early investors against deadlocks and equity dilution disputes.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Corporate Attorneys',
  },
  'esop-pool': {
    groupId: 'corporate',
    groupTitle: 'Corporate Governance & Structure',
    description: 'Establish equity incentive reserve pool (BSPCE/ESOP) for key engineering and executive hires.',
    whyItMatters: 'Essential for attracting top talent in early-stage startups without burning initial cash.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Equity Specialists',
  },
  'ip-protection': {
    groupId: 'ip',
    groupTitle: 'Intellectual Property & Brand Protection',
    description: 'Execute formal IP assignment agreements assigning all founder, employee, and contractor codebase and assets to the company.',
    whyItMatters: 'Institutional investors require clean, unencumbered IP ownership documentation during funding due diligence.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'IP Attorneys',
  },
  'trademark': {
    groupId: 'ip',
    groupTitle: 'Intellectual Property & Brand Protection',
    description: 'Register trademark for brand name and logo with EUIPO or relevant national intellectual property office.',
    whyItMatters: 'Secures exclusive operating rights across target jurisdictions and protects against copycat infringement.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Trademark Lawyers',
  },
  'gdpr': {
    groupId: 'privacy',
    groupTitle: 'Data Privacy & Consumer Protection',
    description: 'Implement EU General Data Protection Regulation protocols, explicit consent flows, and user privacy safeguards.',
    whyItMatters: 'Mandatory for all European commercial operations; protects customer trust and prevents severe regulatory fines.',
    marketplaceCategory: 'compliance',
    marketplaceLabel: 'GDPR Consultants',
  },
  'tos-privacy': {
    groupId: 'privacy',
    groupTitle: 'Data Privacy & Consumer Protection',
    description: 'Publish customized platform Terms of Service and comprehensive Privacy Policy contracts.',
    whyItMatters: 'Establishes the governing contract with users and limits platform commercial liability.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Tech Legal Counsel',
  },
  'rgpd-article30': {
    groupId: 'privacy',
    groupTitle: 'Data Privacy & Consumer Protection',
    description: 'Maintain formal register of data processing activities documenting data categories, flows, and security measures.',
    whyItMatters: 'Required statutory compliance record for European supervisory authority inspections.',
  },
  'dpa': {
    groupId: 'privacy',
    groupTitle: 'Data Privacy & Consumer Protection',
    description: 'Execute Data Processing Agreements with all third-party vendors, SaaS tools, and cloud infrastructure providers.',
    whyItMatters: 'Ensures lawful downstream data processing and clear liability apportionment under GDPR.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Privacy Lawyers',
  },
  'pci-dss': {
    groupId: 'regulatory',
    groupTitle: 'Industry Regulatory & Risk Mitigation',
    description: 'Complete Payment Card Industry Data Security Standard self-assessment or audit protocol.',
    whyItMatters: 'Required by payment processors and card networks to handle or route transaction data safely.',
    marketplaceCategory: 'compliance',
    marketplaceLabel: 'PCI Auditors',
  },
  'fin-reg': {
    groupId: 'regulatory',
    groupTitle: 'Industry Regulatory & Risk Mitigation',
    description: 'Review financial services, payment intermediation, and regulatory licensing requirements.',
    whyItMatters: 'Confirms regulatory exemptions and avoids unauthorized financial activities.',
    marketplaceCategory: 'compliance',
    marketplaceLabel: 'FinTech Specialists',
  },
  'employment-contracts': {
    groupId: 'regulatory',
    groupTitle: 'Industry Regulatory & Risk Mitigation',
    description: 'Prepare standard employment contracts, contractor agreements, and confidentiality covenants.',
    whyItMatters: 'Ensures full compliance with local labor codes and prevents contractor misclassification risks.',
    marketplaceCategory: 'legal',
    marketplaceLabel: 'Employment Lawyers',
  },
  'liability-insurance': {
    groupId: 'regulatory',
    groupTitle: 'Industry Regulatory & Risk Mitigation',
    description: 'Procure professional indemnity (RC Pro) and cyber liability insurance policy coverage.',
    whyItMatters: 'Protects the venture against commercial damage claims, cyber breaches, and operational disruptions.',
  },
};

const GROUPS = [
  {
    id: 'corporate',
    title: 'Corporate Governance & Structure',
    description: 'Entity registration, shareholder governance, and corporate banking foundations.',
    icon: Building2,
  },
  {
    id: 'ip',
    title: 'Intellectual Property & Brand Protection',
    description: 'Proprietary IP assignment covenants, copyright protection, and trademark registrations.',
    icon: ShieldCheck,
  },
  {
    id: 'privacy',
    title: 'Data Privacy & Consumer Protection',
    description: 'GDPR protocols, customer privacy policies, data processing agreements, and statutory registries.',
    icon: Lock,
  },
  {
    id: 'regulatory',
    title: 'Industry Regulatory & Risk Mitigation',
    description: 'Specific sectoral compliance, payment certifications, labor agreements, and liability insurance.',
    icon: Scale,
  },
] as const;

export default function CompliancePage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();
  const [checklist, setChecklist] = useState<LegalChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const existing = (journey.phase3Data as { legalChecklist?: LegalChecklist })?.legalChecklist;
        const cl = existing?.items?.length ? existing : await creatorJourneyApi.generateLegalChecklist();
        if (active) setChecklist(cl);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Couldn't load the compliance checklist.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cycle = async (item: LegalChecklistItem) => {
    setBusyItem(item.id);
    try {
      const updated = await creatorJourneyApi.updateLegalItem(item.id, NEXT_STATUS[item.status]);
      setChecklist(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update item status.");
    } finally {
      setBusyItem(null);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = () => {
    completeStep(3, 5);
    router.push('/dashboard/creator/phase-3/formation');
  };

  const items = useMemo(() => (Array.isArray(checklist?.items) ? checklist.items : []), [checklist]);
  const mandatory = items.filter((i) => i.category === 'mandatory');
  const mandatoryDone = mandatory.filter((i) => i.status === 'done').length;
  const mandatoryRemaining = mandatory.length - mandatoryDone;
  const pct =
    checklist && checklist.totalCount > 0
      ? Math.round((checklist.completedCount / checklist.totalCount) * 100)
      : 0;

  // Group items by domain
  const groupedItems = useMemo(() => {
    const map: Record<string, LegalChecklistItem[]> = {
      corporate: [],
      ip: [],
      privacy: [],
      regulatory: [],
    };

    items.forEach((item) => {
      const meta = LEGAL_ITEM_META[item.id];
      const g = meta?.groupId || 'corporate';
      if (map[g]) map[g].push(item);
      else map.corporate.push(item);
    });

    return map;
  }, [items]);

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="Step 3.5"
      title="Legal & Compliance Checklist"
      description="Tailored corporate, IP, data privacy, and regulatory readiness roadmap for your venture. Mark completed items as you advance."
    >
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground font-sans">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Generating tailored compliance checklist…
        </div>
      )}

      {error && !loading && (
        <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 max-w-xl mx-auto space-y-3 font-sans">
          <p className="text-destructive text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()} className="rounded-xl">
            Retry Loading
          </Button>
        </Card>
      )}

      {checklist && !loading && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Progress & Compliance Readiness Card */}
          <Card className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">
                    Readiness Scorecard
                  </span>
                  <Badge variant="outline" className="text-badge font-mono text-primary border-primary/30">
                    Self-Attested
                  </Badge>
                </div>
                <h3 className="text-lg font-bold font-sans text-foreground">
                  Compliance &amp; Governance Progress
                </h3>
                <p className="text-xs text-muted-foreground font-sans">
                  Completed items contribute directly to your investor readiness scorecard in Step 3.7.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:text-right">
                <div>
                  <div className="text-3xl font-extrabold font-mono text-primary">{pct}%</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {checklist.completedCount} of {checklist.totalCount} Completed
                  </div>
                </div>
              </div>
            </div>

            <Progress value={pct} className="h-2 bg-muted rounded-full" aria-label={`${pct}% compliance readiness`} />

            {mandatoryRemaining > 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-sans">
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  {mandatoryRemaining} mandatory {mandatoryRemaining === 1 ? 'item is' : 'items are'} remaining. You can proceed now and return anytime prior to company incorporation.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-sans">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>All critical regulatory and legal milestones achieved. Ready for company incorporation.</span>
              </div>
            )}
          </Card>

          {/* Categorized Domain Groups */}
          <div className="space-y-6">
            {GROUPS.map((group) => {
              const groupItems = groupedItems[group.id] ?? [];
              if (groupItems.length === 0) return null;

              const completedInGroup = groupItems.filter((i) => i.status === 'done').length;
              const totalInGroup = groupItems.length;
              const groupPct = Math.round((completedInGroup / totalInGroup) * 100);
              const GroupIcon = group.icon;

              return (
                <Card key={group.id} className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <GroupIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold font-sans text-foreground">{group.title}</h4>
                        <p className="text-xs text-muted-foreground font-sans">{group.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <Badge variant="outline" className="text-xs font-mono">
                        {completedInGroup}/{totalInGroup} Done ({groupPct}%)
                      </Badge>
                    </div>
                  </div>

                  {/* Checklist Items in Group */}
                  <div className="space-y-3 pt-1">
                    {groupItems.map((item) => {
                      const done = item.status === 'done';
                      const busy = busyItem === item.id;
                      const meta = LEGAL_ITEM_META[item.id];
                      const isExpanded = expandedDetails[item.id] ?? false;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-xl border transition-all duration-200 p-4 font-sans',
                            done
                              ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                              : 'border-border/70 bg-card/60 hover:border-border hover:bg-card',
                          )}
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Checkbox Button */}
                            <button
                              type="button"
                              onClick={() => cycle(item)}
                              disabled={busy}
                              aria-label={`${done ? 'Mark as pending' : 'Mark as done'}: ${item.label}`}
                              aria-pressed={done}
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-60"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : done ? (
                                <SquareCheckBig className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" strokeWidth={1.75} />
                              )}
                            </button>

                            {/* Item Main Content */}
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={cn(
                                      'text-sm font-semibold tracking-tight transition-colors',
                                      done ? 'text-muted-foreground line-through' : 'text-foreground',
                                    )}
                                  >
                                    {item.label}
                                  </span>

                                  {item.category === 'mandatory' && (
                                    <Badge variant="outline" className="text-badge font-sans font-medium text-destructive border-destructive/30">
                                      Required
                                    </Badge>
                                  )}

                                  {item.badge && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-badge font-sans font-medium',
                                        item.badge === 'urgent'
                                          ? 'border-destructive/30 text-destructive bg-destructive/10'
                                          : 'border-primary/30 text-primary bg-primary/10',
                                      )}
                                    >
                                      {item.badge === 'urgent' ? 'Urgent' : 'FinTech'}
                                    </Badge>
                                  )}

                                  {item.aiGenerable && (
                                    <Badge variant="secondary" className="text-badge font-sans font-medium gap-1 text-muted-foreground border border-border">
                                      <FileText className="h-2.5 w-2.5" /> Standard Template
                                    </Badge>
                                  )}
                                </div>

                                {/* Action Buttons: Details Toggle & Marketplace Link */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {item.showFindSp && meta?.marketplaceCategory && (
                                    <Button
                                      asChild
                                      variant="outline"
                                      size="sm"
                                      className="h-7 rounded-lg border-border text-xs gap-1 font-sans font-medium text-muted-foreground hover:text-foreground"
                                    >
                                      <Link href={`/marketplace?category=${meta.marketplaceCategory}`}>
                                        <Search className="h-3 w-3 text-primary" />
                                        <span>{meta.marketplaceLabel ?? 'Find Providers'}</span>
                                      </Link>
                                    </Button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => toggleDetails(item.id)}
                                    className="text-xs text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                                    aria-label="Toggle details"
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Plain Short Description */}
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {meta?.description ?? 'Compliance milestone for venture legal readiness.'}
                              </p>

                              {/* Expandable Why It Matters Box */}
                              {isExpanded && meta?.whyItMatters && (
                                <div className="pt-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 space-y-1">
                                  <span className="font-semibold text-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3 text-primary" /> Why this is essential:
                                  </span>
                                  <p>{meta.whyItMatters}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Bottom Step Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/creator/phase-3/forecast')}
              className="text-xs font-medium font-sans text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Financial Forecast
            </Button>
            <Button onClick={handleContinue} className="gap-2 font-sans font-semibold rounded-xl">
              Proceed to Company Formation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
