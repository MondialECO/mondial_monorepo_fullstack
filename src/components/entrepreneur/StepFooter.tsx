'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StepFooterProps {
  backUrl: string;
  nextUrl?: string;
  nextLabel?: string;
  onNextClick?: () => void | Promise<void>;
  isNextDisabled?: boolean;
  showSaveDraft?: boolean;
  onSaveDraft?: () => void | Promise<void>;
  className?: string;
  isLoading?: boolean;
  nextValidationError?: string;
}

export function StepFooter({
  backUrl,
  nextUrl,
  nextLabel = 'Continue',
  onNextClick,
  isNextDisabled = false,
  showSaveDraft = false,
  onSaveDraft,
  className,
  isLoading = false,
  nextValidationError,
}: StepFooterProps) {
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState(false);

  const handleNextClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!onNextClick) return;
    try {
      await onNextClick();
    } catch (error) {
      console.error('Next click error:', error);
    }
  };

  const handleSaveDraft = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!onSaveDraft) return;
    setIsSavingDraft(true);
    try {
      await onSaveDraft();
      setSaveDraftSuccess(true);
      setTimeout(() => setSaveDraftSuccess(false), 2000);
    } catch (error) {
      console.error('Save draft error:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const nextButtonContent = isLoading ? (
    <>
      <span className="inline-block w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin mr-2" />
      Validating...
    </>
  ) : (
    <>
      {nextLabel}
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </>
  );

  return (
    <div className="space-y-3">
      {nextValidationError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {nextValidationError}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t border-border',
          className
        )}
      >
        {/* Back Button */}
        <Link href={backUrl}>
          <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground font-medium hover:bg-accent transition disabled:opacity-50">
            Back
          </button>
        </Link>

        {/* Right Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-2 md:gap-3 w-full sm:w-auto">
          {showSaveDraft && (
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className={cn(
                'w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground font-medium transition',
                isSavingDraft
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-accent',
                saveDraftSuccess && 'border-success-text bg-success-light'
              )}
            >
              {isSavingDraft ? 'Saving...' : saveDraftSuccess ? '✓ Saved' : 'Save Draft'}
            </button>
          )}

          {/* Next/Continue Button */}
          {nextUrl ? (
            <Link href={nextUrl} onClick={(e) => {
              if (isNextDisabled || isLoading || onNextClick) {
                e.preventDefault();
                if (onNextClick && !isLoading) handleNextClick();
              }
            }} className="w-full sm:w-auto">
              <button
                disabled={isNextDisabled || isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition',
                  isNextDisabled || isLoading
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {nextButtonContent}
              </button>
            </Link>
          ) : (
            <button
              onClick={handleNextClick}
              disabled={isNextDisabled || isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition',
                isNextDisabled || isLoading
                  ? 'bg-neutral-100 text-neutral-5 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              )}
            >
              {nextButtonContent}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
