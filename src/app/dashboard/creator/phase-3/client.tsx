'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

export default function Phase3Client() {
  const router = useRouter();
  const [selected, setSelected] = useState<'PATH_A' | 'PATH_B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: 'PATH_A' | 'PATH_B') => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Get actual idea ID from context
      const ideaId = 'sample-idea-id';

      await axios.put(`/api/creator/cross-roads/${ideaId}/decide`, {
        decision: decision,
      });

      if (decision === 'PATH_A') {
        router.push('/dashboard/creator/phase-5a');
      } else {
        // PATH_B: Transition to Entrepreneur
        await axios.put('/api/auth/transition-role', { newRole: 'Entrepreneur' });
        router.push('/dashboard/entrepreneur/phase-2/step-1');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record decision');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-1 mb-2">Phase 3: Crossroads Decision</h1>
        <p className="text-neutral-5 mb-8">
          Choose your path forward. You can pivot later, but this determines your immediate next steps.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* PATH A: Monetize IP */}
          <div
            onClick={() => setSelected('PATH_A')}
            className={`border-2 rounded-lg p-6 cursor-pointer transition ${
              selected === 'PATH_A'
                ? 'border-primary bg-primary/5'
                : 'border-neutral-2 bg-white hover:border-primary/50'
            }`}
          >
            <h2 className="text-2xl font-bold text-neutral-1 mb-3">PATH A: Sell or License IP</h2>
            <p className="text-neutral-5 mb-6">
              Monetize your intellectual property directly. List ideas on the marketplace, receive offers from investors
              and companies, and negotiate deals without building a full company.
            </p>
            <div className="text-sm text-neutral-5 space-y-2 mb-6">
              <p>✓ List ideas on marketplace</p>
              <p>✓ Receive investment offers</p>
              <p>✓ Negotiate royalty agreements</p>
              <p>✓ IP remains your asset</p>
            </div>
            <Button
              onClick={() => handleDecision('PATH_A')}
              disabled={isLoading}
              className="w-full"
              variant={selected === 'PATH_A' ? 'default' : 'outline'}
            >
              {isLoading ? 'Processing...' : 'Choose PATH A'}
            </Button>
          </div>

          {/* PATH B: Build Company */}
          <div
            onClick={() => setSelected('PATH_B')}
            className={`border-2 rounded-lg p-6 cursor-pointer transition ${
              selected === 'PATH_B'
                ? 'border-primary bg-primary/5'
                : 'border-neutral-2 bg-white hover:border-primary/50'
            }`}
          >
            <h2 className="text-2xl font-bold text-neutral-1 mb-3">PATH B: Build a Company</h2>
            <p className="text-neutral-5 mb-6">
              Use your idea as the foundation for a startup company. Access entrepreneurship tools, funding preparation,
              and investor access directly through your company profile.
            </p>
            <div className="text-sm text-neutral-5 space-y-2 mb-6">
              <p>✓ Create a company profile</p>
              <p>✓ Access entrepreneur tools</p>
              <p>✓ Raise institutional funding</p>
              <p>✓ Build a team</p>
            </div>
            <Button
              onClick={() => handleDecision('PATH_B')}
              disabled={isLoading}
              className="w-full"
              variant={selected === 'PATH_B' ? 'default' : 'outline'}
            >
              {isLoading ? 'Processing...' : 'Choose PATH B'}
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm">
            <strong>Note:</strong> You can pursue both paths simultaneously after Phase 3. This choice determines which
            pipeline opens first.
          </p>
        </div>
      </div>
    </div>
  );
}
