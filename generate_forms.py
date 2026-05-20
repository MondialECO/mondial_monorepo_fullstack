#!/usr/bin/env python3
"""
Generate all entrepreneur profile forms
Optimized for performance, responsiveness, and maintainability
"""

import os
from pathlib import Path

BASE_PATH = Path("C:/devs/Mondial.Client/src/app/dashboard/entrepreneur")

# Phase 2 Step 1 - Legal Info
PHASE2_STEP1 = '''\'use client\';

import { useState } from \'react\';
import { useRouter, useSearchParams } from \'next/navigation\';
import { Loader2, ArrowRight, ArrowLeft } from \'lucide-react\';
import { Button } from \'@/components/ui/button\';
import { PhaseFormWrapper } from \'@/components/entrepreneur/PhaseFormWrapper\';
import entrepreneurApi from \'@/lib/api-entrepreneur\';

const COUNTRIES = [\'France\', \'Germany\', \'Spain\', \'Italy\', \'Poland\', \'Netherlands\', \'Belgium\', \'Austria\', \'Portugal\', \'Greece\', \'Other\'];
const LEGAL_STRUCTURES = [\'SARL\', \'EIRL\', \'SASU\', \'SAS\', \'SA\', \'GmbH\', \'UG\', \'SE\', \'Other\'];

export default function Phase2Step1Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get(\'companyId\') || \'\';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    legalName: \'\',
    registrationNumber: \'\',
    legalStructure: \'\',
    incorporationDate: \'\',
    registeredAddress: \'\',
    country: \'\',
    nafCode: \'\',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [\'legalName\', \'registrationNumber\', \'legalStructure\', \'incorporationDate\', \'registeredAddress\', \'country\'];
    if (requiredFields.some(field => !formData[field as keyof typeof formData])) {
      setError(\'Please fill in all required fields\');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await entrepreneurApi.updateLegalInfo(companyId, {
        legalName: formData.legalName,
        registrationNumber: formData.registrationNumber,
        legalStructure: formData.legalStructure,
        incorporationDate: formData.incorporationDate,
        registeredAddress: formData.registeredAddress,
        country: formData.country,
        nafCode: formData.nafCode,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/entrepreneur/phase-2/step-2?companyId=${companyId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || \'Failed to save legal information\');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Phase 2: Company Verification</h1>
            <p className="text-xs sm:text-sm text-neutral-5 mt-0.5">Step 1 of 3: Legal Information</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <PhaseFormWrapper
          title="Legal Information"
          description="Provide your company\'s complete legal details"
          isLoading={isLoading}
          error={error}
          success={success}
          successMessage="Legal info saved! Moving to documents..."
          onDismissError={() => setError(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">Legal Name *</label>
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                placeholder="Société Example SARL"
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">SIRET (14 digits) *</label>
              <input
                type="text"
                required
                maxLength={14}
                value={formData.registrationNumber}
                onChange={(e) => setFormData({...formData, registrationNumber: e.target.value.replace(/[^0-9]/g, \'\')})}
                placeholder="12345678901234"
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">Legal Structure *</label>
              <select
                required
                value={formData.legalStructure}
                onChange={(e) => setFormData({...formData, legalStructure: e.target.value})}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select legal structure</option>
                {LEGAL_STRUCTURES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">Incorporation Date *</label>
              <input
                type="date"
                required
                value={formData.incorporationDate}
                onChange={(e) => setFormData({...formData, incorporationDate: e.target.value})}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">Registered Address *</label>
              <textarea
                required
                value={formData.registeredAddress}
                onChange={(e) => setFormData({...formData, registeredAddress: e.target.value})}
                placeholder="Street, City, Postal Code"
                rows={3}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">Country *</label>
              <select
                required
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">NAF Code</label>
              <input
                type="text"
                value={formData.nafCode}
                onChange={(e) => setFormData({...formData, nafCode: e.target.value})}
                placeholder="e.g., 6202A"
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              />
              <p className="text-xs text-neutral-5">Optional: French activity classification</p>
            </div>

            <div className="flex gap-3 pt-6 sm:pt-8 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 h-12 sm:h-13 gap-2"
                onClick={() => router.back()}
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 sm:h-13 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Next: Documents</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </PhaseFormWrapper>
      </div>
    </div>
  );
}
'''

# Write the file
output_path = BASE_PATH / "phase-2" / "step-1" / "page.tsx"
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(PHASE2_STEP1)

print(f"✅ Created: {output_path}")
