'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientSubmitReview, workroomErrorMessage } from '@/hooks/queries/workroom-client';
import type { Review, WorkroomDetail } from '@/types/workroom';

const CATEGORIES = [
  { key: 'overallRating', label: 'Overall' },
  { key: 'qualityRating', label: 'Quality' },
  { key: 'communicationRating', label: 'Communication' },
  { key: 'deliveryRating', label: 'Delivery' },
  { key: 'professionalismRating', label: 'Professionalism' },
  { key: 'valueRating', label: 'Value' },
] as const;

type RatingKey = (typeof CATEGORIES)[number]['key'];

function StarRow({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            className={`size-5 ${
              n <= value
                ? 'fill-rating text-rating'
                : 'text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewPanel({ detail }: { detail: WorkroomDetail }) {
  const { engagement, review } = detail;

  // The endpoint requires a Completed engagement, so don't offer it earlier.
  if (engagement.engagementStatus !== 'Completed' && !review) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Review</h2>
      {review ? <ExistingReview review={review} /> : <ReviewForm engagementId={engagement.id} />}
    </section>
  );
}

function ExistingReview({ review }: { review: Review }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <StarRow value={review[c.key]} readOnly />
          </div>
        ))}
      </div>

      {review.writtenReview && (
        <p className="rounded-md bg-muted p-3 text-sm text-foreground">{review.writtenReview}</p>
      )}

      {review.providerResponse && (
        <div className="rounded-md border border-border p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            Provider&apos;s response
          </p>
          <p className="text-sm text-foreground">{review.providerResponse}</p>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ engagementId }: { engagementId: string }) {
  const submit = useClientSubmitReview();
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    overallRating: 0,
    qualityRating: 0,
    communicationRating: 0,
    deliveryRating: 0,
    professionalismRating: 0,
    valueRating: 0,
  });
  const [writtenReview, setWrittenReview] = useState('');

  // Backend validates every rating as Range(1,5), so all six must be set.
  const complete = CATEGORIES.every((c) => ratings[c.key] >= 1);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Rate your experience with this provider.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{c.label}</span>
            <StarRow
              value={ratings[c.key]}
              onChange={(n) => setRatings((prev) => ({ ...prev, [c.key]: n }))}
            />
          </div>
        ))}
      </div>

      <textarea
        value={writtenReview}
        onChange={(e) => setWrittenReview(e.target.value)}
        rows={4}
        placeholder="Anything you'd want another buyer to know? (optional)"
        className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      {submit.isError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
          {workroomErrorMessage(submit.error)}
        </p>
      )}

      <Button
        onClick={() =>
          submit.mutate({ id: engagementId, payload: { ...ratings, writtenReview } })
        }
        disabled={!complete || submit.isPending}
        className="w-full"
      >
        {submit.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit review'
        )}
      </Button>

      {!complete && (
        <p className="text-xs text-muted-foreground">Rate all six categories to submit.</p>
      )}
    </div>
  );
}
