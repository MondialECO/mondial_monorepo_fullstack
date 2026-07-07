'use client';

import { StepNumber } from '@/types/entrepreneur';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorConfig {
  step: StepNumber;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'pending';
}

interface ProgressSidebarProps {
  title: string;
  steps: StepIndicatorConfig[];
  overallScore: number;
  scoreLabel?: string;
  scoreDescription?: string;
}

export function ProgressSidebar({
  title,
  steps,
  overallScore,
  scoreLabel = 'OVERALL SCORE',
  scoreDescription = 'Complete Step 1 to unlock to identity checks module.',
}: ProgressSidebarProps) {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 bg-card border border-border rounded-2xl p-4 sm:p-5 md:p-6 lg:p-7">
      {/* Progress Section */}
      <div>
        <h2 className="text-lg font-semibold  tracking-tight text-foreground mb-5 sm:mb-6">
          {title}
        </h2>

        {/* Steps Timeline Container - Constrained for timeline line */}
        <div className="relative">
          {/* Vertical line connector - contained within steps only */}
          {steps.length > 1 && (
            <div
              className="absolute left-3 top-0 w-0.5 bg-border rounded-full"
              style={{
                height: `calc((${steps.length - 1}) * 6rem)`,
              }}
            />
          )}

          {/* Steps Items */}
          <div className="space-y-6 sm:space-y-8 md:space-y-9 relative">
            {steps.map((step) => (
              <div key={step.step} className="flex gap-3 relative z-10">
                {/* Icon */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center font-semibold text-xs sm:text-sm',
                    step.status === 'completed' &&
                      'bg-success-text text-white',
                    step.status === 'current' &&
                      'bg-card border border-border text-foreground',
                    step.status === 'pending' &&
                      'bg-card border border-border text-foreground opacity-60'
                  )}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4" aria-hidden />
                  ) : (
                    step.step
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      step.status === 'completed' && 'text-success-text',
                      step.status === 'current' && 'text-foreground',
                      step.status === 'pending' && 'text-foreground opacity-60'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Card - Clean separation from timeline */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3 relative z-20">
        <div className="flex justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground">
            {scoreLabel}
          </span>
          <span className="text-sm font-semibold text-primary">
            {overallScore}%
          </span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden shadow-sm">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
            style={{ width: `${overallScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground leading-snug">{scoreDescription}</p>
      </div>
    </div>
  );
}
