'use client';

import { Sparkles, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { type AiReviewResponse } from '@/lib/api-entrepreneur';

interface Phase7ReviewVisualsProps {
  review: AiReviewResponse | null;
}


function StageRow({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: number; status: 'completed' | 'missing' }) {
  const isCompleted = status === 'completed';
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b last:border-0">
      <div className="flex gap-3 items-center w-40">
        <Icon className="w-5 h-5 text-primary" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <div className="flex gap-2 items-center w-40">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
        </div>
        <p className="text-sm font-medium text-muted-foreground text-right w-10">{value}%</p>
      </div>
      <div className="w-40 text-right">
        {isCompleted ? (
          <div className="inline-flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-success-text" />
            <span className="text-xs font-medium text-success-text">Completed</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 bg-destructive/10 px-3 py-1 rounded-full">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">Missing</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ title, description, points, action }: { title: string; description: string; points: number; action: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b last:border-0">
      <div className="flex gap-3 items-center flex-1 min-w-0">
        <div className="bg-primary/10 rounded-full p-2.5 shrink-0 w-10 h-10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex gap-2 items-center">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <div className="bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              <p className="text-xs font-semibold text-primary">+{points} pts</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button className="shrink-0 px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
        {action}
      </button>
    </div>
  );
}

export function Phase7ReviewVisuals({ review }: Phase7ReviewVisualsProps) {
  if (!review) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <span className="text-sm text-muted-foreground">No review yet — run the readiness review to generate your score.</span>
      </div>
    );
  }

  const sb = review.scoreBreakdown;
  const recs = review.recommendations ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN (2 cols): Profile + Stages + Recommendations + History */}
      <div className="lg:col-span-2 space-y-6">
        {/* Investor-Ready Profile */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex gap-6">
            {/* Circular progress bar */}
            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${(review.overallScore / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                  strokeLinecap="round"
                  className="text-primary transition-all"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                />
              </svg>
              {/* Center content */}
              <div className="absolute text-center">
                <p className="text-4xl font-bold text-primary">{review.overallScore}</p>
                <p className="text-xs font-medium text-muted-foreground">/100</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Investor-Ready Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Your profile scores {review.overallScore}/100. Complete {recs.length} actions to unlock Phase 8.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="bg-success/10 px-3 py-1.5 rounded-full">
                  <p className="text-xs font-semibold text-success-text">
                    {review.investorReadyBadge ? '✓ Badge Eligible' : '⊘ Below Threshold'}
                  </p>
                </div>
                <div className="bg-primary/10 px-3 py-1.5 rounded-full">
                  <p className="text-xs font-semibold text-primary">{recs.length} Actions</p>
                </div>
                <div className="bg-warning/10 px-3 py-1.5 rounded-full">
                  <p className="text-xs font-semibold text-warning">Phase 7 of 9</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Progress Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="bg-primary/5 flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="w-40">
              <p className="text-sm font-semibold text-foreground">Stage</p>
            </div>
            <div className="w-40">
              <p className="text-sm font-semibold text-foreground">Progress</p>
            </div>
            <div className="w-40 text-right">
              <p className="text-sm font-semibold text-foreground">Status</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            <StageRow icon={CheckCircle2} label="Verification" value={sb.verificationScore} status="completed" />
            <StageRow icon={CheckCircle2} label="Equity & Cap Table" value={sb.equityScore} status="completed" />
            <StageRow icon={CheckCircle2} label="Financials" value={sb.financialScore} status="completed" />
            <StageRow icon={CheckCircle2} label="Funding Ask" value={sb.fundingScore} status="completed" />
            <StageRow icon={AlertCircle} label="Data Room" value={sb.dataRoomScore} status={sb.dataRoomScore === 100 ? 'completed' : 'missing'} />
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="bg-primary/5 flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-2 items-center">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI Recommendations</p>
            </div>
            <div className="bg-primary/10 px-3 py-1.5 rounded-md">
              <p className="text-xs font-semibold text-primary">{recs.length} Actions</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recs.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground p-4">
                No recommendations — profile is complete.
              </div>
            ) : (
              recs.map((r, i) => (
                <RecommendationCard
                  key={`${r.title}-${i}`}
                  title={r.title}
                  description={r.description || ''}
                  points={r.potentialPointGain || 0}
                  action={r.priority === 'high' ? 'Fix Now' : 'Apply'}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN (1 col): Pitch Deck + Badge (Sticky) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Pitch Deck Analysis Card */}
        {review?.pitchDeckAnalysis && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-6 h-fit shadow-sm">
            {/* Top Visual Badge */}
            <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex gap-2 items-center">
                <p className="text-sm font-semibold text-foreground">Pitch Deck Analysis</p>
              </div>
              <div className="bg-background border border-border rounded-full px-2 py-1">
                <p className="text-sm font-bold text-primary">{review.pitchDeckAnalysis.grade}</p>
              </div>
            </div>
            {/* Content */}
            <div className="px-5 py-6 space-y-6">
              {/* Average Score Card */}
              <div className="bg-background rounded-xl p-4 border border-border/50 text-center">
                <p className="text-xs font-medium text-muted-foreground mb-2">Average Score</p>
                <p className="text-3xl font-bold text-warning">{review.pitchDeckAnalysis.averageScore}/10</p>
              </div>

              {/* Score breakdown with compact progress bars */}
              <div className="space-y-3.5">
                {[
                  { label: 'Clarity & Narrative', score: review.pitchDeckAnalysis.clarityNarrative, color: 'bg-primary' },
                  { label: 'Market Size Proof', score: review.pitchDeckAnalysis.marketSizeProof, color: 'bg-info' },
                  { label: 'Traction & Metrics', score: review.pitchDeckAnalysis.tractionMetrics, color: 'bg-success' },
                  { label: 'Team Pedigree', score: review.pitchDeckAnalysis.teamPedigree, color: 'bg-warning' },
                ].map(({ label, score, color }) => (
                  <div key={label} className="space-y-1.5">
                    {/* Label + Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate pr-2">{label}</span>
                      <span className="text-xs font-semibold text-foreground">{score}/10</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${(score / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Investor-Ready Badge Card */}
          {review?.investorReadyBadge && (
            <div className="bg-card border border-success/30 p-6 shadow-sm space-y-4">
              {/* Badge Icon + Score */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                  <Trophy className="w-8 h-8 text-success-text" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{review.overallScore}</p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-2">
                <h3 className="text-base font-semibold text-foreground">Investor-Ready Badge</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You've achieved a {review.overallScore}/100 readiness score. Claiming this badge unlocks Phase 8 matchmaking.
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-2 py-3 border-t border-b border-border/50">
                {[
                  'Priority listing in Marketplace',
                  '"Verified Investor Ready" tag',
                  'Unlock Phase 8: Capital Matchmaking',
                ].map((benefit) => (
                  <div key={benefit} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Claim Badge
                </button>
                <button className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  Unlock Phase 8
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default Phase7ReviewVisuals;
