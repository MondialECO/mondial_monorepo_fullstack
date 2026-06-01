'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getDashboardMyIdeas } from '@/lib/api-creator-dashboard';
import type { Idea } from '@/types/creator/dashboard';

export default function Phase3Client() {
  const router = useRouter();
  const [selected, setSelected] = useState<'PATH_B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [ideasLoading, setIdeasLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getDashboardMyIdeas();
        if (!cancelled) setIdeas(result);
      } catch {
        if (!cancelled) setIdeas([]);
      } finally {
        if (!cancelled) setIdeasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasIdea = (ideas?.length ?? 0) > 0;
  const firstIdeaId = ideas?.[0]?.id;

  const handlePathB = async () => {
    if (!firstIdeaId) {
      setError('You need at least one idea before choosing a path.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.put(`/api/creator/cross-roads/${firstIdeaId}/decide`, {
        decision: 'PATH_B',
      });
      await axios.put('/api/auth/transition-role', { newRole: 'Entrepreneur' });
      router.push('/dashboard/entrepreneur/phase-2/step-1');
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to record decision';
      setError(message);
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

        {ideasLoading ? (
          <div className="rounded-lg border border-neutral-2 bg-white p-6 text-sm text-neutral-5">
            Checking your ideas…
          </div>
        ) : !hasIdea ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">
              Create your first idea to choose a path
            </h2>
            <p className="text-sm text-amber-900 mb-4">
              The crossroads decision is anchored to a real idea. Add one to continue.
            </p>
            <Button asChild>
              <Link href="/create-project">Create an idea</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* PATH A: Monetize IP — disabled until marketplace ships in P1 */}
            <div
              aria-disabled="true"
              className="relative border-2 rounded-lg p-6 border-neutral-2 bg-neutral-100 opacity-70 cursor-not-allowed"
            >
              <div className="absolute right-4 top-4 rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-5">
                Marketplace launching in P1
              </div>
              <h2 className="text-2xl font-bold text-neutral-1 mb-3">PATH A: Sell or License IP</h2>
              <p className="text-neutral-5 mb-6">
                Monetize your intellectual property directly. List ideas on the marketplace, receive offers from
                investors and companies, and negotiate deals without building a full company.
              </p>
              <div className="text-sm text-neutral-5 space-y-2 mb-6">
                <p>✓ List ideas on marketplace</p>
                <p>✓ Receive investment offers</p>
                <p>✓ Negotiate royalty agreements</p>
                <p>✓ IP remains your asset</p>
              </div>
              <Button disabled aria-disabled="true" className="w-full cursor-not-allowed" variant="outline">
                Marketplace launching in P1
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
                Use your idea as the foundation for a startup company. Access entrepreneurship tools, funding
                preparation, and investor access directly through your company profile.
              </p>
              <div className="text-sm text-neutral-5 space-y-2 mb-6">
                <p>✓ Create a company profile</p>
                <p>✓ Access entrepreneur tools</p>
                <p>✓ Raise institutional funding</p>
                <p>✓ Build a team</p>
              </div>
              <Button
                onClick={handlePathB}
                disabled={isLoading}
                className="w-full"
                variant={selected === 'PATH_B' ? 'default' : 'outline'}
              >
                {isLoading ? 'Processing...' : 'Choose PATH B'}
              </Button>
            </div>
          </div>
        )}

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
