'use client';

import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Check,
  FolderOpen,
  Mail,
  Sparkles,
  Star,
  UserCheck,
  X,
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
import EmptyState from '@/components/ui/empty-state';
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
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Could not load the verification queue"
        description="Refresh the page or try again in a moment."
      />
    );
  }

  const list = providers ?? [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No moderation reviews pending"
        description="Providers who remediate an admin rejection and resubmit will appear here."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.userId}>
            <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {p.name?.trim() || 'Unnamed provider'}
                  </p>
                  <Badge variant="warning">Under review</Badge>
                </div>
                {p.profile.headline && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {p.profile.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {p.email || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {p.profile.skills.length} skills
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5" />
                    {p.profile.portfolioItems.length} portfolio
                  </span>
                  <span>Submitted {submittedLabel(p.profile.verificationSubmittedAt)}</span>
                </div>
                {p.profile.serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.profile.serviceCategories.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(p)}>
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm({ mode: 'reject', provider: p })}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirm({ mode: 'approve', provider: p })}
                >
                  <Check className="h-4 w-4" />
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

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio ({provider.profile.portfolioItems.length})
                </p>
                {provider.profile.portfolioItems.length === 0 ? (
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
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button className="flex-1" onClick={() => onApprove(provider)}>
                  <Check className="h-4 w-4" />
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

  // Reset the reason whenever a new confirmation opens.
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
