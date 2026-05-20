'use client';

import { useState } from 'react';
import {
  Zap,
  TrendingUp,
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  Brain,
  Target,
  Users,
  Lightbulb,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const REVIEW_SCORES = [
  { category: 'Executive Summary', score: 92, weight: 'Critical', icon: Target },
  { category: 'Market Opportunity', score: 88, weight: 'High', icon: BarChart3 },
  { category: 'Business Model', score: 85, weight: 'High', icon: TrendingUp },
  { category: 'Team & Expertise', score: 95, weight: 'Critical', icon: Users },
  { category: 'Financial Projections', score: 82, weight: 'High', icon: BarChart3 },
  { category: 'Product & Technology', score: 90, weight: 'High', icon: Lightbulb },
];

const RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Strengthen Revenue Model Detail',
    description: 'Provide more granular breakdown of revenue streams and unit economics',
    priority: 'High',
    impact: 'Could increase score by 5%',
  },
  {
    id: 2,
    title: 'Expand Competitive Analysis',
    description: 'Add comparison matrix with top 3 competitors and differentiation points',
    priority: 'Medium',
    impact: 'Could increase score by 3%',
  },
  {
    id: 3,
    title: 'Add Go-to-Market Strategy Timeline',
    description: 'Include quarter-by-quarter milestones for the first 18 months',
    priority: 'Medium',
    impact: 'Could increase score by 2%',
  },
];

const COMPARABLE_COMPANIES = [
  { name: 'Similar Startup A', sector: 'SaaS', fundingStage: 'Series A', investorReadiness: '88%' },
  { name: 'Similar Startup B', sector: 'SaaS', fundingStage: 'Seed', investorReadiness: '82%' },
  { name: 'Similar Startup C', sector: 'B2B', fundingStage: 'Pre-Seed', investorReadiness: '79%' },
];

function Phase7PageContent() {
  const { progress } = useEntrepreneurProgress();
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  if (!progress) return null;

  const overallScore = Math.round(REVIEW_SCORES.reduce((sum, s) => sum + s.score, 0) / REVIEW_SCORES.length);
  const isBadgeEligible = overallScore >= 85;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">AI Expert Review</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Comprehensive investor readiness assessment</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/70" />
                <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-neutral-1">{overallScore}</p>
                  <p className="text-xs text-neutral-5 mt-1">/100</p>
                </div>
              </div>
              <p className="text-center font-semibold text-neutral-1">Overall Investor Readiness Score</p>
            </div>

            {/* Badge & Status */}
            <div className="flex flex-col justify-center space-y-6">
              {isBadgeEligible ? (
                <>
                  <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border-2 border-green-200">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-bold text-green-700 text-lg">Investor Ready</p>
                    <p className="text-sm text-green-600 mt-1">You meet quality standards</p>
                  </div>
                  <Button className="w-full gap-2">
                    <Star className="w-4 h-4" />
                    Unlock Investor Matching
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border-2 border-yellow-200">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <p className="font-bold text-yellow-700 text-lg">Almost There</p>
                    <p className="text-sm text-yellow-600 mt-1">5 more points needed</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Review Recommendations
                  </Button>
                </>
              )}

              <div className="pt-4 border-t border-primary/20">
                <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide mb-2">Assessment Date</p>
                <p className="text-sm font-medium text-neutral-1">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Detailed Category Scores
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            >
              {showDetailedAnalysis ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          <div className="space-y-4">
            {REVIEW_SCORES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-1">{item.category}</p>
                        <p className="text-xs text-neutral-5">{item.weight} weight</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">{item.score}</p>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {showDetailedAnalysis && (
            <div className="mt-6 pt-6 border-t-2 border-neutral-2 space-y-4">
              <h4 className="font-semibold text-neutral-1">Key Strengths</h4>
              <ul className="space-y-2">
                {[
                  'Exceptionally strong founding team with proven track record',
                  'Clear and compelling market opportunity with validated demand',
                  'Solid financial projections with realistic growth assumptions',
                ].map((strength, idx) => (
                  <li key={idx} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-1">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Improvement Recommendations */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-neutral-1 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Improvement Recommendations
          </h3>

          <div className="space-y-4">
            {RECOMMENDATIONS.map((rec) => (
              <div key={rec.id} className="border-2 border-neutral-2 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-neutral-1">{rec.title}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          rec.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-5 mb-2">{rec.description}</p>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {rec.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Comparison */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-neutral-1 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparable Companies
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-2">
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Company</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Sector</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Funding Stage</th>
                  <th className="px-4 py-3 text-right font-semibold text-neutral-1">Readiness Score</th>
                </tr>
              </thead>
              <tbody>
                {COMPARABLE_COMPANIES.map((company, idx) => (
                  <tr
                    key={company.name}
                    className={idx !== COMPARABLE_COMPANIES.length - 1 ? 'border-b border-neutral-2' : ''}
                  >
                    <td className="px-4 py-4 font-medium text-neutral-1">{company.name}</td>
                    <td className="px-4 py-4 text-neutral-5">{company.sector}</td>
                    <td className="px-4 py-4 text-neutral-5">{company.fundingStage}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: company.investorReadiness }}
                          />
                        </div>
                        <span className="font-semibold text-neutral-1 w-12 text-right">
                          {company.investorReadiness}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Benchmark:</span> Your company scores above average compared to similar startups at your stage.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        {isBadgeEligible && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Ready for Next Phase</h3>
                <p className="text-sm text-green-800 mb-4">
                  Congratulations! You've achieved investor-ready status. You can now unlock Phase 8: Investor Matching and start connecting with vetted investors.
                </p>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Star className="w-4 h-4" />
                  Proceed to Investor Matching
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase7Page() {
  return (
    <RouteGuard requiredPhase={7}>
      <Phase7PageContent />
    </RouteGuard>
  );
}
