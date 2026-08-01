'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  /** Rendered as the trigger; clicking reveals the inline confirmation. */
  label: string;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  errorMessage?: string | null;
  variant?: 'default' | 'outline' | 'destructive';
  disabled?: boolean;
  disabledReason?: string;
  /** Optional extra input (reason textarea, checkbox) shown inside the panel. */
  children?: React.ReactNode;
  /** Blocks confirm until the caller's own inputs are satisfied. */
  canConfirm?: boolean;
}

/**
 * Inline expand-to-confirm rather than a modal: several of these can appear per
 * milestone, and modals stack badly when the underlying list re-renders on
 * mutation invalidation.
 */
export function ConfirmAction({
  label,
  title,
  body,
  confirmLabel,
  onConfirm,
  isPending,
  errorMessage,
  variant = 'default',
  disabled,
  disabledReason,
  children,
  canConfirm = true,
}: Props) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <div>
        <Button size="sm" variant={variant} disabled>
          {label}
        </Button>
        {disabledReason && (
          <p className="mt-1 text-xs text-muted-foreground">{disabledReason}</p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="w-full rounded-md border border-border bg-card p-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>

      {children && <div className="mt-3 space-y-2">{children}</div>}

      {errorMessage && (
        <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant={variant}
          onClick={onConfirm}
          disabled={isPending || !canConfirm}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Working...
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </div>
  );
}
