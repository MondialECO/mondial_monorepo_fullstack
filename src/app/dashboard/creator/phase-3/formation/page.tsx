'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';

interface SkillGapItem {
  skill: string;
  level: number;
  gap: number;
  recommendation: string;
}

const SKILL_GAPS: SkillGapItem[] = [
  { skill: 'Technology & Development', level: 40, gap: 60, recommendation: 'Tech Co-founder or M50 Dev Shop' },
  { skill: 'Product Management', level: 80, gap: 20, recommendation: 'Founder strength, no immediate hire needed' },
  { skill: 'Visual Branding & Design', level: 90, gap: 10, recommendation: 'Complete via M50 designer / AI Tool' },
  { skill: 'Sales & Go-To-Market', level: 50, gap: 50, recommendation: 'Growth Marketer or Advisory Match' },
  { skill: 'Finance & Compliance', level: 30, gap: 70, recommendation: 'Advisory matches or automated bookkeeping tools' },
];

export default function SkillGapPage() {
  const router = useRouter();
  const { saveOutputVersion, completeStep } = useCreatorProgress();

  const handleCompletePhase3 = () => {
    saveOutputVersion('skillGapVersions', {
      title: 'Skill Gap & Team Recommendations',
      gaps: SKILL_GAPS,
      advisorMatches: [
        { name: 'Siddharth Sen', role: 'Technical Architect', match: 94 },
        { name: 'Rahat Chowdhury', role: 'Legal & Compliance Advisor', match: 88 },
      ],
      strongestSkill: 'Visual Branding & Design',
      highestGap: 'Finance & Compliance',
    });
    completeStep(3, 5); // Step 3.5: Skill Gap
    router.push('/dashboard/creator/phase-3/complete');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.5"
      title="Skill Gap & Team Recommendations"
      description="AI analysis of your current core competencies and recommendations to address key operational gaps."
      stepLabel="Phase 3 Step 5 of 6"
      progress={83}
    >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Skill Gaps List */}
          <Card className="md:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-6">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Competency Analysis</h3>

            <div className="space-y-4">
              {SKILL_GAPS.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground font-bold">{item.skill}</span>
                    <span className="text-muted-foreground">Strength: {item.level}% (Gap: {item.gap}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.level >= 80
                          ? 'bg-success-text'
                          : item.level >= 50
                            ? 'bg-primary'
                            : 'bg-warning'
                        }`}
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic font-medium leading-normal">
                    Recommendation: {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Core Co-founder / Partner Recommendations */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-primary uppercase tracking-widest block font-sans">Partners</span>
              <h4 className="font-bold text-foreground leading-snug">Matched Advisors & Co-founders</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We have pre-filtered 3 legal and engineering advisors in South Asia familiar with B2B SaaS compliance who are open to equity or advisory roles.
              </p>

              <div className="space-y-2.5 pt-2 font-semibold">
                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-foreground">Siddharth Sen</span>
                    <span className="text-[10px] text-muted-foreground">Technical Architect · Ex-Tencent</span>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">94% Match</span>
                </div>
                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-foreground">Rahat Chowdhury</span>
                    <span className="text-[10px] text-muted-foreground">Legal & Compliance Advisor</span>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">88% Match</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2 text-[11px] text-muted-foreground leading-normal mt-4 font-medium">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-warning" />
              <span>Matching is non-binding. Private workrooms open once you reach Phase 6.</span>
            </div>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <Button onClick={handleCompletePhase3} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
            Complete Phase 3 & Unlock Summary <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
    </Phase3SetupShell>
  );
}
