'use client';

import { useRef, useState } from 'react';
import { Loader2, Paperclip, Upload } from 'lucide-react';
import { statusChipClass } from '@/lib/workroom-status';
import { useClientUploadFile, workroomErrorMessage } from '@/hooks/queries/workroom-client';
import type { WorkroomDetail } from '@/types/workroom';

/** Matches the controller's [RequestSizeLimit(20 * 1024 * 1024)]. */
const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPanel({ detail }: { detail: WorkroomDetail }) {
  const { engagement, files, milestones } = detail;
  const upload = useClientUploadFile();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [milestoneId, setMilestoneId] = useState('');
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Safety net: provider-private files should never reach the client from the API,
  // but filter here too rather than trusting that.
  const visible = files.filter((f) => !f.providerPrivate);

  const handlePick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setSizeError(`"${file.name}" is ${formatSize(file.size)} — the limit is 20 MB.`);
      return;
    }
    setSizeError(null);
    upload.mutate(
      { engagementId: engagement.id, file, milestoneId: milestoneId || undefined },
      { onSettled: () => { if (inputRef.current) inputRef.current.value = ''; } }
    );
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Paperclip className="size-4" />
        Files &amp; deliverables
      </h2>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files shared yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{f.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(f.sizeBytes)} · {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusChipClass(f.status)}`}
              >
                {f.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        {milestones.length > 0 && (
          <select
            value={milestoneId}
            onChange={(e) => setMilestoneId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Not attached to a milestone</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border p-4 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
        >
          {upload.isPending ? (
            <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {upload.isPending ? 'Uploading…' : 'Choose a file to upload'}
            </span>
            {/* Matches the controller's [RequestSizeLimit(20 * 1024 * 1024)]. */}
            <span className="block text-xs text-muted-foreground">Up to 20 MB per file</span>
          </span>
        </button>

        {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}
        {upload.isError && (
          <p className="text-xs text-destructive">{workroomErrorMessage(upload.error)}</p>
        )}
      </div>
    </section>
  );
}
