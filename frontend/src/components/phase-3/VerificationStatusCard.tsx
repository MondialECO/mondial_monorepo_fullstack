'use client';

import { CheckCircle2 } from 'lucide-react';

interface VerificationStatusCardProps {
  title: string;
  status: string;
  description: string;
}

export function VerificationStatusCard({
  title,
  status,
  description,
}: VerificationStatusCardProps) {
  return (
    <div className="bg-neutral-4 border border-neutral-2 rounded-lg p-4 sm:p-5">
      <p className="text-xs sm:text-sm font-medium text-neutral-5 uppercase mb-3 sm:mb-4">
        {title}
      </p>
      <div className="flex gap-3 items-start">
        <div className="bg-primary/10 rounded-full p-2.5 flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-primary mb-0.5">
            {status}
          </p>
          <p className="text-xs sm:text-sm text-neutral-5">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
