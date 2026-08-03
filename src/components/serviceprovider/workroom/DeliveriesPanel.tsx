'use client';

import { useState } from 'react';
import { ExternalLink, FileClock, Files, MessageSquareReply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SpCard, SpEmptyState, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { useRespondToReview } from '@/hooks/queries/workroom';
import type { WorkroomDetail, WorkroomFile } from '@/types/workroom';
import { downloadWorkroomFile, isFileDownloadable } from '@/lib/workroom-files';
import { apiError, formatDate, words } from './_shared';
import { safeHttpUrl } from '@/lib/service-provider/url-security';

/**
 * Takes no readOnly flag, unlike its sibling panels. Its only mutation is the provider's
 * response to a client review, and a Review exists only once the engagement is Completed
 * or Archived (SubmitReviewAsync) — which is exactly when readOnly is true. Honouring the
 * flag here would make the response form permanently unreachable. RespondToReviewAsync
 * carries no engagement-status guard for the same reason: it is the one provider action
 * that legitimately outlives the engagement.
 */
export function DeliveriesPanel({ data }: { data: WorkroomDetail }) {
  const groups = data.milestones.map((milestone) => ({ milestone, deliveries: data.deliverables.filter((item) => item.milestoneId === milestone.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)) })).filter((group) => group.deliveries.length > 0);
  return <div className="space-y-6">{groups.length === 0 ? <SpEmptyState icon={Files} title="No delivery history" description="Versioned submissions will appear here after a provider submits the first milestone delivery." /> : groups.map(({ milestone, deliveries }) => <SpCard key={milestone.id}><SpSectionHeader title={milestone.title} description={`${deliveries.length} preserved delivery version${deliveries.length === 1 ? '' : 's'}`} /> <div className="mt-5 space-y-3">{deliveries.map((delivery) => <details key={delivery.id} className="rounded-xl border border-[#E5E7EB] p-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"><div><p className="text-sm font-semibold text-[#171717]">{delivery.title}</p><p className="mt-1 text-xs text-[#6B7280]">Version {delivery.version} · {formatDate(delivery.submittedAt, true)}</p></div><SpStatusBadge>{words(delivery.deliverableStatus)}</SpStatusBadge></summary><div className="mt-4 border-t border-[#E5E7EB] pt-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[#374151]">{delivery.description}</p>{delivery.submissionMessage && <p className="mt-3 rounded-lg bg-[#F9FAFB] p-3 text-sm text-[#374151]">{delivery.submissionMessage}</p>}<p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Client instructions</p><p className="mt-1 text-sm leading-6 text-[#374151]">{delivery.clientInstructions}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><DeliveryFileList fileIds={delivery.fileIds} files={data.files} /><ReferenceList title="External links" values={delivery.externalLinks} links icon={ExternalLink} /></div></div></details>)}</div></SpCard>)}{data.review && <ReviewPanel data={data} />}</div>;
}

function ReviewPanel({ data }: { data: WorkroomDetail }) {
  const respond = useRespondToReview();
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const review = data.review!;
  const submit = async () => { setFeedback(null); try { await respond.mutateAsync({ id: review.id, response: response.trim() }); setFeedback({ status: 'success', message: 'Your public review response was published.' }); setResponse(''); } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The response could not be published.') }); } };
  return <SpCard><div className="flex items-start justify-between gap-4"><div><h2 className="font-heading text-lg font-semibold text-[#171717]">Verified client review</h2><p className="mt-1 text-xs text-[#6B7280]">Submitted {formatDate(review.submittedAt, true)}</p></div><SpStatusBadge tone="positive">★ {review.overallRating}/5</SpStatusBadge></div><p className="mt-4 text-sm italic leading-7 text-[#374151]">“{review.writtenReview || 'No written review.'}”</p><dl className="mt-5 grid gap-3 sm:grid-cols-3"><Rating label="Quality" value={review.qualityRating} /><Rating label="Communication" value={review.communicationRating} /><Rating label="Delivery" value={review.deliveryRating} /><Rating label="Professionalism" value={review.professionalismRating} /><Rating label="Value" value={review.valueRating} /></dl>{review.providerResponse ? <div className="mt-5 rounded-xl bg-[#F9FAFB] p-4"><p className="text-xs font-semibold text-[#6B7280]">Your response</p><p className="mt-2 text-sm leading-6 text-[#374151]">{review.providerResponse}</p></div> : <div className="mt-5"><label htmlFor="review-response" className="text-sm font-semibold text-[#374151]">Respond to this review</label><Textarea id="review-response" value={response} onChange={(event) => setResponse(event.target.value)} className="mt-2" rows={4} /><Button type="button" variant="outline" className="mt-3" onClick={submit} disabled={!response.trim() || respond.isPending}><MessageSquareReply className="size-4" aria-hidden="true" />{respond.isPending ? 'Publishing…' : 'Publish response'}</Button></div>}{feedback && <SpMutationFeedback status={feedback.status} className="mt-4">{feedback.message}</SpMutationFeedback>}</SpCard>;
}

function DeliveryFileList({ fileIds, files }: { fileIds: string[]; files: WorkroomFile[] }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <p className="text-xs font-semibold text-[#6B7280]">Files</p>
      {fileIds.length ? (
        <ul className="mt-2 space-y-2">
          {fileIds.map((id) => {
            const file = files.find((item) => item.id === id);
            const label = file?.originalName ?? `File reference ${id.slice(-6)}`;
            return (
              <li key={id} className="flex items-center gap-2 text-sm text-[#374151]">
                <FileClock className="size-4 shrink-0 text-[#6B7280]" aria-hidden="true" />
                {file && isFileDownloadable(file) ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      try {
                        await downloadWorkroomFile(file);
                      } catch (downloadError) {
                        setError(apiError(downloadError, 'The file could not be downloaded.'));
                      }
                    }}
                    className="break-all text-left underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
                  >
                    {label}
                  </button>
                ) : (
                  label
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#6B7280]">None</p>
      )}
      {error && <SpMutationFeedback status="error" className="mt-3">{error}</SpMutationFeedback>}
    </div>
  );
}

function ReferenceList({ title, values, links, icon: Icon }: { title: string; values: string[]; links?: boolean; icon: typeof FileClock }) { return <div><p className="text-xs font-semibold text-[#6B7280]">{title}</p>{values.length ? <ul className="mt-2 space-y-2">{values.map((value) => { const href = links ? safeHttpUrl(value) : null; return <li key={value} className="flex items-center gap-2 text-sm text-[#374151]"><Icon className="size-4 shrink-0 text-[#6B7280]" aria-hidden="true" />{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{value}</a> : value}</li>; })}</ul> : <p className="mt-2 text-sm text-[#6B7280]">None</p>}</div>; }
function Rating({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-[#F9FAFB] p-3"><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#171717]">{value}/5</dd></div>; }
