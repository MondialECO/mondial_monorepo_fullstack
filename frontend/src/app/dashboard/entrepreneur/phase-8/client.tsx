'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Handshake, CheckCircle2, ChevronRight, Filter, Send } from 'lucide-react';
import { entrepreneurApi } from '@/lib/api-entrepreneur';

interface InvestorMatch {
  id: string;
  name: string;
  type: string;
  matchScore: number;
  investmentRange: string;
  sectors: string[];
  stage: string;
  status: string;
}

interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting';
  details: string;
  date: string;
}

interface Insight {
  totalMatches: number;
  highMatches: number;
  interactions: number;
  averageScore: number;
}

export default function InvestorMatchingClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<InvestorMatch[]>([]);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<InvestorMatch | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [interactionType, setInteractionType] = useState<'call' | 'email' | 'meeting'>('call');
  const [interactionDetails, setInteractionDetails] = useState('');
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [isEnqueuingJob, setIsEnqueuingJob] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('companyId') || '';
    setCompanyId(id);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [matchesData, insightsData] = await Promise.all([
          entrepreneurApi.getInvestorMatches(id),
          entrepreneurApi.getMatchingInsights(id),
        ]);
        setMatches(matchesData || []);
        setInsights(insightsData);
      } catch (err) {
        setError('Failed to load investor matches');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, []);

  // Poll job status when job is running
  useEffect(() => {
    if (!jobStatus || jobStatus.status === 'completed') return;
    const interval = setInterval(async () => {
      try {
        const status = await entrepreneurApi.getJobStatus(jobStatus.jobId);
        setJobStatus(status);
      } catch (err) {
        console.error('Failed to check job status:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobStatus]);

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !interactionDetails.trim()) return;

    setIsSubmittingInteraction(true);
    try {
      await entrepreneurApi.recordInvestorInteraction(
        companyId,
        selectedMatch.id,
        interactionType,
        interactionDetails
      );
      setInteractions([
        ...interactions,
        {
          id: Date.now().toString(),
          type: interactionType,
          details: interactionDetails,
          date: new Date().toISOString(),
        },
      ]);
      setInteractionDetails('');
    } catch (err) {
      setError('Failed to log interaction');
      console.error(err);
    } finally {
      setIsSubmittingInteraction(false);
    }
  };

  const handleEnqueueMatching = async () => {
    setIsEnqueuingJob(true);
    try {
      const job = await entrepreneurApi.enqueueInvestorMatching(companyId);
      setJobStatus(job);
    } catch (err) {
      setError('Failed to enqueue matching job');
      console.error(err);
    } finally {
      setIsEnqueuingJob(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Investor Matching</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Find and connect with investors who match your profile</p>
          </div>
          <Button
            onClick={handleEnqueueMatching}
            disabled={isEnqueuingJob || (jobStatus && jobStatus.status !== 'completed')}
            className="gap-2 ml-4 whitespace-nowrap"
          >
            {isEnqueuingJob ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <span>Next Matches</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Job Status */}
        {jobStatus && jobStatus.status !== 'completed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Re-matching in progress... {jobStatus.progress}%
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        {insights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">Total Matches</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{insights.totalMatches}</p>
            </div>
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">High Matches</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{insights.highMatches}</p>
            </div>
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">Interactions</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{insights.interactions}</p>
            </div>
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">Avg Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{insights.averageScore}%</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {/* Main Content: List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Investor Cards List */}
          <div className="lg:col-span-2 space-y-4">
            {matches.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-2 p-8 text-center">
                <p className="text-neutral-5">No investor matches yet</p>
              </div>
            ) : (
              matches.map((investor) => (
                <div
                  key={investor.id}
                  onClick={() => setSelectedMatch(investor)}
                  className={`bg-white border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition ${
                    selectedMatch?.id === investor.id
                      ? 'border-primary bg-primary/5'
                      : 'border-neutral-2 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between pb-4 border-b border-neutral-2">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-1">{investor.name}</h3>
                      <p className="text-sm text-neutral-5">{investor.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{investor.matchScore}</p>
                      <p className="text-xs text-neutral-5">Match</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-5">Investment Range</p>
                      <p className="text-sm font-semibold text-neutral-1">{investor.investmentRange}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-5">Focus Areas</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {investor.sectors.slice(0, 2).map((sector) => (
                          <span key={sector} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          {selectedMatch && (
            <div className="bg-white rounded-lg border border-neutral-2 p-6 h-fit">
              <h3 className="text-lg font-bold text-neutral-1 mb-4">{selectedMatch.name}</h3>

              {/* Investor Details */}
              <div className="space-y-4 mb-6 pb-6 border-b border-neutral-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-5">Type</p>
                  <p className="text-sm text-neutral-1 mt-1">{selectedMatch.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-5">Investment</p>
                  <p className="text-sm text-neutral-1 mt-1">{selectedMatch.investmentRange}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-5">Stages</p>
                  <p className="text-sm text-neutral-1 mt-1">{selectedMatch.stage}</p>
                </div>
              </div>

              {/* Log Interaction */}
              <form onSubmit={handleInteractionSubmit} className="space-y-3">
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-neutral-2 rounded-md text-sm"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
                <Input
                  placeholder="Add notes..."
                  value={interactionDetails}
                  onChange={(e) => setInteractionDetails(e.target.value)}
                  className="text-sm"
                />
                <Button
                  type="submit"
                  disabled={isSubmittingInteraction || !interactionDetails.trim()}
                  className="w-full gap-2"
                >
                  {isSubmittingInteraction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Log Interaction
                    </>
                  )}
                </Button>
              </form>

              {/* Recent Interactions */}
              {interactions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-2">
                  <h4 className="text-sm font-semibold text-neutral-1 mb-3">Recent Interactions</h4>
                  <div className="space-y-2">
                    {interactions.slice(-3).map((interaction) => (
                      <div key={interaction.id} className="text-xs bg-neutral-50 p-2 rounded">
                        <p className="font-medium text-neutral-1">{interaction.type.toUpperCase()}</p>
                        <p className="text-neutral-5">{interaction.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/dashboard/entrepreneur/phase-9')}>
            Continue to Phase 9
          </Button>
        </div>
      </div>
    </div>
  );
}
