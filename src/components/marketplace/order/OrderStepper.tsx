'use client';

import { Check } from 'lucide-react';

/**
 * Three-node progress indicator. Capped at max-w-md so the nodes don't spread
 * awkwardly across a wide content column.
 */
export function OrderStepper({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="mx-auto mb-8 max-w-md">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const isLast = i === labels.length - 1;

          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    done || active
                      ? 'bg-primary text-primary-foreground'
                      : 'border-2 border-muted-foreground/30 text-muted-foreground'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="size-3.5" /> : n}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-medium ${
                    active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                // Segment reflects whether the step it leaves has been completed.
                <span
                  aria-hidden
                  className={`-mt-5 h-0 flex-1 border-t-2 ${
                    done ? 'border-primary' : 'border-dashed border-muted-foreground/30'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
