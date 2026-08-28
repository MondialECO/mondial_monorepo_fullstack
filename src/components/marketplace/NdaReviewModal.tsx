'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { NdaStatus } from '@/lib/api-marketplace-projects';

interface NdaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ndaStatus: NdaStatus | null;
  onSign: (confirmationText?: string) => Promise<void>;
}

export const NdaReviewModal: React.FC<NdaReviewModalProps> = ({
  isOpen,
  onClose,
  ndaStatus,
  onSign,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ndaStatus) return null;

  const handleSign = async () => {
    if (!agreed) {
      setError('Please agree to the non-disclosure terms before signing.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSign('I accept the terms of the Non-Disclosure Agreement');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to sign NDA. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Project Non-Disclosure Agreement
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mondial Platform Standard Confidentiality Terms (v{ndaStatus.ndaVersion || '1.0'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-700 dark:text-zinc-300">
          {/* Parties metadata card */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <div>
              <span className="text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                Disclosing Party (Creator)
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {ndaStatus.creatorName || 'Project Creator'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                Receiving Party (Entrepreneur)
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {ndaStatus.entrepreneurName || 'Authenticated Entrepreneur'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                Target Project
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {ndaStatus.projectName}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                Effective Date
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{today}</span>
            </div>
          </div>

          {/* Agreement clauses */}
          <div className="space-y-4 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 font-mono text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 uppercase mb-1">
                1. Purpose & Scope of Confidential Information
              </h4>
              <p>
                Confidential Information includes all non-public business plans, financial models,
                pricing schemes, proprietary architecture, technical specifications, and intellectual
                property disclosed for the purpose of evaluating potential partnership, buyout, or investment.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 uppercase mb-1">
                2. Non-Disclosure & Non-Use Obligations
              </h4>
              <p>
                The Receiving Party agrees to maintain strict confidentiality, exercise reasonable care,
                and refrain from disclosing, reproducing, reverse-engineering, or using the Information
                outside the scope of evaluating a commercial transaction with the Disclosing Party.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 uppercase mb-1">
                3. Term & Audit Trail
              </h4>
              <p>
                This agreement shall remain effective for 90 days from the timestamp of signature.
                Electronic execution is recorded with cryptographic hashing and IP logging on the
                Mondial platform audit log.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Acknowledgement checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              I acknowledge that I am signing this Non-Disclosure Agreement in good faith to access
              confidential project materials. I agree to keep all disclosed data strictly confidential.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSign}
            disabled={!agreed || isSubmitting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
              agreed && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span>Signing...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Sign NDA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
