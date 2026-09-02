'use client';

import React, { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ReportTargetType, ReportCategory } from '@/types/admin-reports';
import { submitUserReport } from '@/lib/api-admin-reports';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const CATEGORIES: { label: string; value: ReportCategory }[] = [
  { label: 'Spam or unsolicited content', value: 'Spam' },
  { label: 'Misleading or inaccurate content', value: 'MisleadingContent' },
  { label: 'Harassment or abusive behavior', value: 'HarassmentOrAbuse' },
  { label: 'Inappropriate or harmful content', value: 'InappropriateContent' },
  { label: 'Fraud or scam concern', value: 'FraudOrScamConcern' },
  { label: 'Impersonation', value: 'Impersonation' },
  { label: 'Other violation', value: 'Other' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const [category, setCategory] = useState<ReportCategory>('Spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await submitUserReport({
        targetType,
        targetId,
        category,
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('You already have an active report submitted for this item.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Report Content</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h4 className="text-base font-semibold text-foreground">Report Received</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you for helping keep Mondial Eco secure. Our trust & safety team will review this item.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {targetTitle && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                Reporting <span className="font-semibold text-foreground">{targetType}</span>: {targetTitle}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Reason for report
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Description & details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is misleading, abusive, or violating platform policies..."
                rows={4}
                maxLength={2000}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-right text-[11px] text-muted-foreground mt-1">
                {description.length} / 2000
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
