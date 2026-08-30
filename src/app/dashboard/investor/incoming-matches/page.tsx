'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  MapPin,
  TrendingUp,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import entrepreneurApi, { InvestorIncomingMatchResponse } from '@/lib/api-entrepreneur';
import MessageFounderButton from '@/components/messaging/MessageFounderButton';

export default function InvestorIncomingMatchesPage() {
  const [matches, setMatches] = useState<InvestorIncomingMatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadMatches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await entrepreneurApi.getInvestorIncomingMatches();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incoming matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const handleRespond = async (matchId: string, action: 'interested' | 'passed') => {
    setActionInProgress(matchId);
    setError('');
    try {
      const updated = await entrepreneurApi.respondToInvestorMatch(matchId, action);
      setMatches((prev) => prev.map((m) => (m.matchId === matchId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update match status to ${action}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handshakesCount = matches.filter((m) => (m.status || '').toLowerCase() === 'accepted').length;
  const pendingCount = matches.filter(
    (m) => (m.entrepreneurInterest || '').toLowerCase() === 'interested' && (m.status || '').toLowerCase() !== 'accepted'
  ).length;

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            Incoming Matches &amp; Double Opt-In
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review companies that have expressed interest in connecting with your investment mandate.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMatches} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">Total Inbound</span>
          <p className="text-2xl font-bold text-foreground mt-1">{matches.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">Awaiting Your Response</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground uppercase">Confirmed Handshakes</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{handshakesCount}</p>
        </div>
      </div>

      {error && (
        <div className="border rounded-xl p-4 flex gap-3 items-start text-sm bg-destructive/10 border-destructive/30 text-destructive" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Matches List */}
      {isLoading ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          Loading incoming matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3 bg-card">
          <Handshake className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Incoming Matches Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            When entrepreneurs complete Phase 7 review and express interest in your profile, their opportunities will appear here for bilateral double opt-in.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/investor/discovery">Discover Opportunities</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const isHandshake = (m.status || '').toLowerCase() === 'accepted';
            const isPassed = (m.investorInterest || '').toLowerCase() === 'passed';
            const isFounderInterested = (m.entrepreneurInterest || '').toLowerCase() === 'interested';

            return (
              <div
                key={m.matchId}
                data-testid={`investor-match-card-${m.matchId}`}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">
                        <Link href={`/dashboard/investor/discovery/${m.companyId}`} className="hover:underline">
                          {m.companyName}
                        </Link>
                      </h3>
                      {isHandshake ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                          MUTUAL HANDSHAKE
                        </Badge>
                      ) : isPassed ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          PASSED
                        </Badge>
                      ) : isFounderInterested ? (
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                          NEW COMPANY INTEREST
                        </Badge>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {m.industry} · {m.fundingRoundType} · {m.country}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{m.matchScore}%</div>
                    <span className="text-[11px] text-muted-foreground">Mandate Fit</span>
                  </div>
                </div>

                {/* Narrative / Pitch */}
                {m.elevatorPitch ? (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.elevatorPitch}</p>
                ) : m.tagline ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.tagline}</p>
                ) : null}

                {/* Match Rationale */}
                {m.matchRationale && (
                  <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Why this match</span>
                    <p className="leading-relaxed">{m.matchRationale}</p>
                  </div>
                )}

                {/* Financial Ask Context */}
                <div className="flex items-center gap-4 text-xs flex-wrap border-t border-border pt-3">
                  <div>
                    <span className="text-muted-foreground">Funding Ask: </span>
                    <span className="font-semibold text-foreground">EUR {m.fundingAskAmount?.toLocaleString() ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Round: </span>
                    <span className="font-semibold text-foreground">{m.fundingRoundType}</span>
                  </div>
                  {m.phase7IntelligenceSnapshot?.riskBand && (
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-muted-foreground">Readiness Risk: </span>
                      <span className="font-semibold text-foreground">{m.phase7IntelligenceSnapshot.riskBand}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3 flex-wrap">
                  <Link
                    href={`/dashboard/investor/discovery/${m.companyId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View Company Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {isHandshake ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mr-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Handshake Confirmed
                        </div>
                        <MessageFounderButton companyId={m.companyId} label="Message Founder" />
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={actionInProgress === m.matchId}
                          onClick={() => handleRespond(m.matchId, 'passed')}
                        >
                          Pass
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionInProgress === m.matchId}
                          onClick={() => handleRespond(m.matchId, 'interested')}
                          className="bg-primary text-primary-foreground"
                        >
                          Interested
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
