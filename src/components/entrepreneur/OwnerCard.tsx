'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OwnerCardProps {
  icon: ReactNode;
  name: string;
  role: string;
  status?: 'not-started' | 'in-progress' | 'completed';
  className?: string;
}

const statusConfig = {
  'not-started': {
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    label: 'NOT STARTED',
  },
  'in-progress': {
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    label: 'IN PROGRESS',
  },
  'completed': {
    bgClass: 'bg-success-light',
    textClass: 'text-success-text',
    label: 'COMPLETED',
  },
};

export function OwnerCard({
  icon,
  name,
  role,
  status = 'not-started',
  className,
}: OwnerCardProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-3 mb-4', className)}>
      <div className={cn(
        'w-14 h-14 rounded-full border-2 flex items-center justify-center',
        'bg-primary/10 border-primary'
      )}>
        <div className="w-6 h-6 text-primary">{icon}</div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      {status && (
        <div className={cn(config.bgClass, 'px-3 py-1 rounded-full')}>
          <p className={cn('text-xs font-semibold', config.textClass)}>
            {config.label}
          </p>
        </div>
      )}
    </div>
  );
}
