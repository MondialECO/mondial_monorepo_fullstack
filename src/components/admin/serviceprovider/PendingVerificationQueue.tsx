'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Check,
  FolderOpen,
  Mail,
  Sparkles,
  Star,
  UserCheck,
  X,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/shared';
import {
  useApproveProvider,
  usePendingProviders,
  useRejectProvider,
} from '@/hooks/queries/admin-service-provider';
import type { PendingProvider } from '@/types/admin-service-provider';

function submittedLabel(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

type ConfirmState =
  | { mode: 'approve' | 'reject'; provider: PendingProvider }
  | null;

export function PendingVerificationQueue() {
  const { data: providers, isLoading, isError } = usePendingProviders();
  const [selected, setSelected] = useState<PendingProvider | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <AdminErrorState
        title="Could not load the queue"
        message="There was a problem reaching the server. Please try refreshing."
      />
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <AdminEmptyState
        title="No service provider credentials are awaiting review."
        description="The moderation queue is clear. Submitted provider profiles and credentials will appear here."
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {providers.map((p) => (
          <Card key={p.userId} className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {p.name?.trim().charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {p.name?.trim() || 'Unnamed provider'}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Trust {p.profile.trustScore.toFixed(1)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {p.profile.completionPercent}% complete
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {p.email || '—'}
                  </p>
                  {p.profile.headline && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {p.profile.headline}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted {submittedLabel(p.profile.verificationSubmittedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(p)}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Inspect Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ mode: 'reject', provider: p })}
                >
                  <X className="h-4 w-4 mr-1 text-rose-500" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirm({ mode: 'approve', provider: p })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProviderDetailDrawer
        provider={selected}
        onClose={() => setSelected(null)}
        onApprove={(p) => {
          setSelected(null);
          setConfirm({ mode: 'approve', provider: p });
        }}
        onReject={(p) => {
          setSelected(null);
          setConfirm({ mode: 'reject', provider: p });
        }}
      />

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function DetailList({ label, items = [] }: { label: string; items?: string[] }) {
  const safeItems = items ?? [];
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {safeItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {safeItems.map((i) => (
            <Badge key={i} variant="secondary">
              {i}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderDetailDrawer({
  provider,
  onClose,
  onApprove,
  onReject,
}: {
  provider: PendingProvider | null;
  onClose: () => void;
  onApprove: (p: PendingProvider) => void;
  onReject: (p: PendingProvider) => void;
}) {
  return (
    <Sheet open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {provider && (
          <>
            <SheetHeader>
              <SheetTitle>{provider.name?.trim() || 'Unnamed provider'}</SheetTitle>
              <SheetDescription>{provider.email || '—'}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-4">
              <div className="p-2.5 bg-muted/40 rounded-md flex items-center justify-between text-xs border border-border">
                <span className="text-muted-foreground">Unified Profile:</span>
                <Link
                  href={`/dashboard/admin/users/${provider.userId}`}
                  target="_blank"
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  Inspect User Account <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" /> Trust {provider.profile.trustScore.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  Completion {provider.profile.completionPercent}%
                </span>
                <span className="text-sm text-muted-foreground">
                  Submitted {submittedLabel(provider.profile.verificationSubmittedAt)}
                </span>
              </div>

              {provider.profile.headline && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Headline
                  </p>
                  <p className="text-sm text-foreground">{provider.profile.headline}</p>
                </div>
              )}
              {provider.profile.bio && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Bio
                  </p>
                  <p className="text-sm text-muted-foreground">{provider.profile.bio}</p>
                </div>
              )}

              <Separator />

              <DetailList label="Service categories" items={provider.profile.serviceCategories} />
              <DetailList label="Skills" items={provider.profile.skills} />
              <DetailList label="Industries" items={provider.profile.industries} />
              <DetailList label="Languages" items={provider.profile.languages} />
              <DetailList label="Pricing models" items={provider.profile.pricingModels} />

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Credentials & Licenses (Read Only)
                  </p>
                  <Badge variant="outline" className="text-[10px]">Decision API Pending</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Official credential verification state machine is monitored in audit log.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio ({provider.profile.portfolioItems?.length ?? 0})
                </p>
                {(!provider.profile.portfolioItems || provider.profile.portfolioItems.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No portfolio items.</p>
                ) : (
                  <div className="space-y-2">
                    {provider.profile.portfolioItems.map((item) => (
                      <div key={item.index} className="rounded-lg border p-3">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                            {item.description}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-sm text-primary underline underline-offset-2"
                          >
                            Visit link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onReject(provider)}
                >
                  <X className="h-4 w-4 mr-1 text-rose-500" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => onApprove(provider)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState;
  onClose: () => void;
}) {
  const approve = useApproveProvider();
  const reject = useRejectProvider();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const mode = state?.mode;
  const provider = state?.provider;

  const pending = approve.isPending || reject.isPending;

  const handleClose = () => {
    if (pending) return;
    setReason('');
    setReasonError(false);
    onClose();
  };

  const submit = async () => {
    if (!provider) return;
    try {
      if (mode === 'approve') {
        await approve.mutateAsync(provider.userId);
      } else {
        const trimmed = reason.trim();
        if (!trimmed) {
          setReasonError(true);
          return;
        }
        await reject.mutateAsync({ userId: provider.userId, reason: trimmed });
      }
      setReason('');
      setReasonError(false);
      onClose();
    } catch {
      // Mutation rolls back optimistically; keep the dialog open to retry.
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? 'Approve provider?' : 'Reject provider?'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'approve'
              ? `${provider?.name?.trim() || 'This provider'} will be verified and receive the Verified Provider Badge.`
              : `${provider?.name?.trim() || 'This provider'} will be notified with the reason below.`}
          </DialogDescription>
        </DialogHeader>

        {mode === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(false);
              }}
              placeholder="Explain what needs to change before resubmission."
            />
            {reasonError && (
              <p className="text-sm text-destructive">A reason is required.</p>
            )}
          </div>
        )}

        {(approve.isError || reject.isError) && (
          <p className="text-sm text-destructive">
            The action could not be completed. Try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={mode === 'reject' ? 'destructive' : 'default'}
            onClick={submit}
            disabled={pending}
            className={mode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : ''}
          >
            {pending
              ? 'Working…'
              : mode === 'approve'
                ? 'Approve'
                : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
