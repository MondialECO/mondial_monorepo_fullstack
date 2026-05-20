'use client';

import { cn } from '@/lib/utils';

interface PhaseHeaderProps {
  title: string;
  subtitle: string;
  progressLabel?: string;
  progressValue?: string | number;
  progressPercentage?: number;
  className?: string;
}

export function PhaseHeader({
  title,
  subtitle,
  progressLabel = 'Verification',
  progressValue = 'From 80% Filled',
  progressPercentage = 80,
  className,
}: PhaseHeaderProps) {
  return (
    <div
      className={cn(
        'bg-neutral-3 border-2 border-neutral-4 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 sm:gap-4 md:gap-8 pb-3 sm:pb-4 md:pb-6 border-b border-neutral-2">
        {/* Left Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-1 mb-1 sm:mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-5 line-clamp-2">
            {subtitle}
          </p>
        </div>

        {/* Right Section - Progress */}
        {progressPercentage !== undefined && (
          <div className="text-left md:text-right w-full md:w-auto md:flex-shrink-0">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-5 mb-1.5">
              {progressLabel}
            </p>
            <p className="text-sm font-semibold text-neutral-1 mb-2">
              {progressValue}
            </p>
            <div className="h-1.5 w-full md:max-w-xs bg-neutral-2 rounded-full overflow-hidden shadow-sm">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
