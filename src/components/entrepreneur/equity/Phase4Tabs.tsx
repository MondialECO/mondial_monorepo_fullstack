'use client';

import { cn } from '@/lib/utils';

export type Phase4Tab = 'overview' | 'cap-table' | 'esop' | 'dilution' | 'history';

const TABS: { id: Phase4Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'cap-table', label: 'Cap Table' },
  { id: 'esop', label: 'ESOP' },
  { id: 'dilution', label: 'Dilution Sim' },
  { id: 'history', label: 'History' },
];

export function Phase4Tabs({
  active,
  onChange,
}: {
  active: Phase4Tab;
  onChange: (tab: Phase4Tab) => void;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-6 border-b-2 border-border overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-2 pb-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute -bottom-0.5 left-0 right-0  rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
