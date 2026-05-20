'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhaseFormWrapper } from '@/components/entrepreneur/PhaseFormWrapper';
import entrepreneurApi from '@/lib/api-entrepreneur';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    website: '',
    tagline: '',
  });

  const industries = [
    'SaaS',
    'FinTech',
    'HealthTech',
    'EdTech',
    'AI/ML',
    'E-Commerce',
    'Logistics',
    'Marketplace',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.industry || !formData.website || !formData.tagline) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const company = await entrepreneurApi.createCompany({
        companyName: formData.companyName,
        industry: formData.industry,
        website: formData.website,
        tagline: formData.tagline,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/entrepreneur');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create company. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">
            Create Your Company Profile
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <PhaseFormWrapper
          title="Welcome to Mondial"
          description="Let's start by setting up your company profile"
          isLoading={isLoading}
          error={error}
          success={success}
          successMessage="Company created! Redirecting..."
          onDismissError={() => setError(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Company Name */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., TechStudio Inc."
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Industry */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
                Industry *
              </label>
              <select
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm sm:text-base text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
              >
                <option value="">Select an industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
                Website *
              </label>
              <input
                type="url"
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
                Company Tagline *
              </label>
              <textarea
                required
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A short description of your company (max 150 characters)"
                maxLength={150}
                rows={3}
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
              <p className="text-xs text-neutral-5">
                {formData.tagline.length}/150 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 sm:h-13"
                onClick={() => router.back()}
              >
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
                    Creating...
                  </>
                ) : (
                  <>
                    Create Company
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
