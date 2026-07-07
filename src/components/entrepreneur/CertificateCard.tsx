'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CertificateCardProps {
  logo: ReactNode;
  title: string;
  issueDate: string;
  expireDate: string;
  verified?: boolean;
  className?: string;
}

export function CertificateCard({
  logo,
  title,
  issueDate,
  expireDate,
  verified = true,
  className,
}: CertificateCardProps) {
  return (
    <div
      className={cn(
        'bg-primary/10 border-2 border-card rounded-2xl p-8 space-y-8',
        className
      )}
    >
      <div className="border-b border-primary/20 pb-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center text-2xl">
            {logo}
          </div>

          {verified && (
            <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full">
              <div className="w-4 h-4 text-primary">✓</div>
              <p className="text-xs font-semibold text-primary">
                Verified Company
              </p>
            </div>
          )}

          <h3 className="text-xl font-semibold text-foreground text-center">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Issued
          </p>
          <p className="text-sm font-semibold text-foreground">{issueDate}</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Expires
          </p>
          <p className="text-sm font-semibold text-foreground">{expireDate}</p>
        </div>
      </div>
    </div>
  );
}
