'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EntrepreneurLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EntrepreneurLayout({
  sidebar,
  children,
  className,
}: EntrepreneurLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-neutral-100 flex lg:flex-row flex-col gap-3 p-3 sm:p-4 md:gap-4 md:p-4 lg:gap-6 lg:p-8 max-w-7xl lg:mx-auto',
        className
      )}
    >
      {/* Sidebar - rendered once, single instance */}
      <div className="lg:w-80 lg:flex-shrink-0">
        <details
          className="w-full bg-neutral-3 border-2 border-neutral-4 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0"
          open
        >
          <summary className="font-semibold text-neutral-1 cursor-pointer text-sm md:text-base lg:hidden list-none">
            Progress & Score
          </summary>
          <div className="mt-3 md:mt-4 lg:mt-0">{sidebar}</div>
        </details>
      </div>

      {/* Main Content - rendered once, single instance */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
