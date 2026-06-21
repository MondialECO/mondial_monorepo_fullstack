'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Download, CheckCircle2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';

export default function ComplianceRoadmapPage() {
  const router = useRouter();
  const { saveOutputVersion, upsertDocument, completeStep } = useCreatorProgress();

  const [jurisdiction, setJurisdiction] = useState('Delaware (C-Corp)');
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerated(true);
  };

  const handleNext = () => {
    const entityType = jurisdiction.includes('Delaware')
      ? 'C-Corporation'
      : jurisdiction.includes('Singapore')
        ? 'Private Limited'
        : 'Osaühing (OÜ)';

    saveOutputVersion('complianceVersions', {
      title: 'Compliance & Legal Roadmap',
      jurisdiction,
      entityType,
      authorizedShares: 10000000,
      founderPool: '8,000,000 shares (80%)',
      kycStatus: 'Verified AML Compliance',
      documentsDrafted: isGenerated,
    });
    saveOutputVersion('companyFormationVersions', {
      title: 'Company Formation Draft',
      jurisdiction,
      entityType,
      documents: ['Articles_of_Incorporation.pdf', 'Shareholder_Agreement_Draft.pdf'],
    });
    upsertDocument({
      id: 'phase3-articles-incorporation',
      name: 'Articles_of_Incorporation_Delaware.pdf',
      category: 'Legal Registry',
      size: '185 KB',
      phase: 3,
      step: 4,
      outputKey: 'companyFormationVersions',
    });
    upsertDocument({
      id: 'phase3-shareholder-agreement',
      name: 'Shareholder_Agreement_Draft.pdf',
      category: 'Legal Registry',
      size: '210 KB',
      phase: 3,
      step: 4,
      outputKey: 'companyFormationVersions',
    });
    completeStep(3, 4); // Step 3.4: Compliance Roadmap
    router.push('/dashboard/creator/phase-3/formation');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.4"
      title="Compliance & Legal Incorporation"
      description="Select your legal incorporation jurisdiction and generate draft articles of association."
      stepLabel="Phase 3 Step 4 of 6"
      progress={66}
    >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Jurisdictions Choices */}
          <Card className="md:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Legal Registry Jurisdiction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Delaware (C-Corp)', 'Singapore (Pte Ltd)', 'Estonia (OÜ)'].map((jur) => (
                  <Button
                    key={jur}
                    type="button"
                    variant="outline"
                    onClick={() => setJurisdiction(jur)}
                    className={`h-auto justify-start p-3.5 rounded-xl border text-xs font-bold text-left transition-all ${jurisdiction === jur
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                      }`}
                  >
                    {jur}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-muted/35 border border-border/80 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Incorporation Details ({jurisdiction})</span>
              <div className="space-y-2 text-xs font-semibold">
                <p className="text-muted-foreground">Entity Type: <span className="font-bold text-foreground">{jurisdiction.includes('Delaware') ? 'C-Corporation' : jurisdiction.includes('Singapore') ? 'Private Limited' : 'Osaühing (OÜ)'}</span></p>
                <p className="text-muted-foreground">Authorized Shares: <span className="font-bold text-foreground">10,000,000</span></p>
                <p className="text-muted-foreground">Founder Pool: <span className="font-bold text-foreground">8,000,000 shares (80%)</span></p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleGenerate} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs py-4 px-6">
                {isGenerated ? 'Documents Drafted! ✓' : 'Draft Articles of Incorporation'}
              </Button>
            </div>
          </Card>

          {/* Compliance Checklist Panel */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-primary uppercase tracking-widest block font-sans">Regulatory Check</span>
              <h4 className="font-bold text-foreground leading-snug">Compliance & KYC Integration</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Incorporating an entity requires completed biometric signals from your KYC gate. You have completed the prerequisite Identity Validation.
              </p>
            </div>
            <div className="p-3 bg-success-light border border-success-text/20 rounded-xl flex items-center gap-2 text-xs text-success-text font-bold mt-4">
              <Check className="h-4 w-4 shrink-0" /> Verified AML Compliance
            </div>
          </Card>
        </div>

        {/* Generated PDF files */}
        {isGenerated && (
          <div className="p-5 border border-success-text/20 bg-success-light rounded-2xl space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-success-text font-bold text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              Incorporation Documents Ready to Download (Saved to Document Vault)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 rounded-xl border border-border bg-card flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-text" />
                  <span className="font-medium text-foreground">Articles_of_Incorporation.pdf</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-text" />
                  <span className="font-medium text-foreground">Shareholder_Agreement_Draft.pdf</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <Button onClick={handleNext} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
            Proceed to Skill Gap Analysis <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
    </Phase3SetupShell>
  );
}
