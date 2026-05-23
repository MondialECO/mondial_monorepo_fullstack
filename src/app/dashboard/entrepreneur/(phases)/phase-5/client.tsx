'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Phase5Client() {
  const router = useRouter();
  const { moveToNextStep } = useEntrepreneurProgress();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pitchFile, setPitchFile] = useState<File | null>(null);
  const [narrative, setNarrative] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const res = await axios.get('/api/companies/current-phase');
        setCompanyId(res.data.companyId);
      } catch (err) {
        // Silently fail, user can still proceed
      }
    };
    fetchCompanyId();
  }, []);

  const handlePitchUpload = async () => {
    if (!pitchFile || !companyId) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', pitchFile);

      await axios.post(`/api/companies/${companyId}/pitch-deck`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Pitch deck uploaded successfully!');
      setPitchFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNarrativeSave = async () => {
    if (!narrative || !companyId) {
      setError('Please enter a narrative');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(`/api/companies/${companyId}/funding-narrative`, { narrative });
      alert('Funding narrative saved!');
      setNarrative('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    moveToNextStep(5, 1);
    router.push('/dashboard/entrepreneur/phase-6');
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Pitch Deck Upload */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-2 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-1 dark:text-white mb-4">Upload Pitch Deck</h3>
        <div className="space-y-4">
          <input
            type="file"
            accept=".pdf,.pptx,.ppt,.doc,.docx"
            onChange={(e) => setPitchFile(e.target.files?.[0] || null)}
            disabled={isLoading}
            className="block w-full text-sm"
          />
          <Button onClick={handlePitchUpload} disabled={isLoading || !pitchFile || !companyId}>
            {isLoading ? 'Uploading...' : 'Upload Pitch'}
          </Button>
          {pitchFile && <p className="text-sm text-neutral-5">Selected: {pitchFile.name}</p>}
        </div>
      </div>

      {/* Funding Narrative */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-2 dark:border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-neutral-1 dark:text-white mb-4">Funding Narrative</h3>
        <div className="space-y-4">
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            disabled={isLoading}
            placeholder="Describe your funding needs and how you'll use the capital..."
            className="w-full h-32 p-3 border border-neutral-2 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-1 dark:text-white placeholder-neutral-5 dark:placeholder-neutral-4"
          />
          <Button onClick={handleNarrativeSave} disabled={isLoading || !narrative || !companyId}>
            {isLoading ? 'Saving...' : 'Save Narrative'}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
          Back to Dashboard
        </Button>
        <Button onClick={handleContinue} className="gap-2">
          Go to Phase 6 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
