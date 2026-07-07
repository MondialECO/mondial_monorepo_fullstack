'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'not-started' | 'in-progress' | 'completed';
  label: string;
  className?: string;
}

const statusConfig = {
  'not-started': {
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
  },
  'in-progress': {
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
  },
  'completed': {
    bgClass: 'bg-success-light',
    textClass: 'text-success-text',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={cn(config.bgClass, 'px-3 py-1 rounded-full', className)}>
      <p className={cn('text-xs font-semibold', config.textClass)}>{label}</p>
    </div>
  );
}
