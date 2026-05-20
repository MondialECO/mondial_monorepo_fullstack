'use client';

import Link from 'next/link';
import { LucideIcon, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhaseTemplateProps {
  phaseNumber: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  trustScore: number;
  isLocked: boolean;
  requirements: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
  features: Array<{
    title: string;
    description: string;
  }>;
  startHref?: string;
}

export function PhaseTemplate({
  phaseNumber,
  title,
  subtitle,
  icon: Icon,
  trustScore,
  isLocked,
  requirements,
  features,
  startHref = '#',
}: PhaseTemplateProps) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
            <div className={cn('p-2 rounded-lg flex-shrink-0', isLocked ? 'bg-neutral-2' : 'bg-primary/10')}>
              <Icon className={cn('w-6 h-6', isLocked ? 'text-neutral-100' : 'text-primary')} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-1">{title}</h1>
              <p className="text-sm sm:text-base text-neutral-5 mt-1 sm:mt-2">{subtitle}</p>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-neutral-5 font-medium uppercase">PHASE STATUS</p>
                <p className="text-2xl sm:text-3xl font-bold text-neutral-1 mt-2">
                  {isLocked ? 'Locked' : 'In Progress'}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-neutral-5 font-medium uppercase">TRUST SCORE</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-2">+{trustScore}</p>
              </div>
            </div>

            {isLocked && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                <Lock className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900">Phase Locked</p>
                  <p className="text-sm text-yellow-800">
                    Complete the previous phase to unlock this phase.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Requirements Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-1">What You'll Complete</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {requirements.map((req) => {
              const ReqIcon = req.icon;
              return (
                <div
                  key={req.title}
                  className={cn(
                    'border-2 rounded-xl p-4 transition-all',
                    isLocked
                      ? 'bg-neutral-100 border-neutral-2 opacity-50'
                      : 'bg-neutral-3 border-neutral-4 hover:border-primary'
                  )}
                >
                  <div className="flex gap-3">
                    <ReqIcon className={cn('w-5 h-5 flex-shrink-0', isLocked ? 'text-neutral-5' : 'text-primary')} />
                    <div>
                      <h3 className="font-semibold text-neutral-1">{req.title}</h3>
                      <p className="text-sm text-neutral-5 mt-1">{req.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        {features.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-1">Phase Features</h2>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature.title} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-neutral-1">
                      <strong>{feature.title}:</strong> {feature.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/entrepreneur">Back to Overview</Link>
          </Button>
          {!isLocked && startHref !== '#' && (
            <Button asChild>
              <Link href={startHref} className="flex items-center gap-2">
                Start Phase {phaseNumber}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
