'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface InfoPanelProps {
  icon?: ReactNode;
  title: string;
  description: string;
  variant?: 'info' | 'warning' | 'error';
  className?: string;
}

const variantConfig = {
  info: {
    bgClass: 'bg-info/10',
    borderClass: 'border-info/20',
    iconClass: 'text-info',
    titleClass: 'text-info',
    textClass: 'text-info/80',
  },
  warning: {
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/20',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
    textClass: 'text-warning/80',
  },
  error: {
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/20',
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
    textClass: 'text-destructive/80',
  },
};

export function InfoPanel({
  icon,
  title,
  description,
  variant = 'info',
  className,
}: InfoPanelProps) {
  const config = variantConfig[variant];
  const Icon = icon || AlertCircle;

  return (
    <div
      className={cn(
        'rounded-2xl p-6 flex gap-4 border-2',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <Icon className={cn('w-6 h-6 flex-shrink-0 mt-0.5', config.iconClass)} />
      <div>
        <p className={cn('text-sm font-semibold mb-2', config.titleClass)}>
          {title}
        </p>
        <p className={cn('text-sm', config.textClass)}>{description}</p>
      </div>
    </div>
  );
}
