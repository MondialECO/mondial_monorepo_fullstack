"use client";

import { useState } from "react";
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SpCard,
  SpEmptyState,
  SpFormField,
  SpMutationFeedback,
  SpSectionHeader,
} from "@/components/serviceprovider/ui";
import {
  useAddPortfolioItem,
  useDeletePortfolioItem,
  useUpdatePortfolioItem,
} from "@/hooks/queries/service-provider";
import type { PortfolioItem } from "@/types/service-provider";
import { useSpDirtyFormGuard } from "@/hooks/useSpDirtyFormGuard";
import { safeHttpUrl, validateOptionalHttpUrl } from "@/lib/service-provider/url-security";

type Draft = { title: string; description: string; url: string; imagePath: string };

const emptyDraft: Draft = { title: "", description: "", url: "", imagePath: "" };

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  const add = useAddPortfolioItem();
  const update = useUpdatePortfolioItem();
  const remove = useDeletePortfolioItem();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dirtyGuard = useSpDirtyFormGuard(draft, { enabled: editIndex !== null });
  const urlError = validateOptionalHttpUrl(draft.url);

  function openAdd() {
    setDraft(emptyDraft);
    dirtyGuard.markClean(emptyDraft);
    setEditIndex(-1);
    setError(null);
  }

  function openEdit(item: PortfolioItem) {
    const next = {
      title: item.title,
      description: item.description ?? "",
      url: item.url ?? "",
      imagePath: item.imagePath ?? "",
    };
    setDraft(next);
    dirtyGuard.markClean(next);
    setEditIndex(item.index);
    setError(null);
  }

  function closeEditor() {
    setEditIndex(null);
    setError(null);
  }

  async function save() {
    if (!draft.title.trim() || !draft.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (urlError) {
      setError(urlError);
      return;
    }
    setError(null);
    setFeedback(null);
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim() || null,
      imagePath: draft.imagePath.trim() || null,
    };
    try {
      if (editIndex === -1) {
        await add.mutateAsync(payload);
        setFeedback("Portfolio item added.");
      } else if (editIndex !== null) {
        await update.mutateAsync({ index: editIndex, ...payload });
        setFeedback("Portfolio item updated.");
      }
      dirtyGuard.markClean(draft);
      closeEditor();
    } catch {
      setError("Could not save this portfolio item. Check the fields and try again.");
    }
  }

  async function confirmDelete() {
    if (!deleteItem) return;
    setFeedback(null);
    try {
      await remove.mutateAsync(deleteItem.index);
      setFeedback(`“${deleteItem.title}” was removed from your portfolio.`);
      setDeleteItem(null);
    } catch {
      setDeleteItem(null);
      setFeedback("The portfolio item could not be deleted. Try again.");
    }
  }

  const saving = add.isPending || update.isPending;

  return (
    <SpCard>
      <SpSectionHeader
        title="Portfolio"
        description={`${items.length} ${items.length === 1 ? "item" : "items"}. Image paths are displayed when already supplied; direct media upload is not connected.`}
        action={<Button onClick={openAdd} size="sm"><Plus className="size-4" />Add item</Button>}
      />

      {feedback && <SpMutationFeedback status={feedback.includes("could not") ? "error" : "success"} className="mt-5">{feedback}</SpMutationFeedback>}

      {items.length === 0 ? (
        <SpEmptyState
          className="mt-5 min-h-52"
          icon={FolderOpen}
          title="No portfolio items yet"
          description="Add real work samples so clients can evaluate your delivery."
          action={<Button onClick={openAdd} size="sm" variant="outline"><Plus className="size-4" />Add your first item</Button>}
        />
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.index} className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <div
                className="flex aspect-video items-center justify-center bg-[#F4F5F7] bg-cover bg-center"
                style={item.imagePath ? { backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.28),rgba(0,0,0,.02)),url(${JSON.stringify(item.imagePath)})` } : undefined}
              >
                {!item.imagePath && <FolderOpen className="size-7 text-[#9CA3AF]" aria-hidden="true" />}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-heading text-base font-semibold text-[#171717]">{item.title}</h3>
                {item.description && <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#6B7280]">{item.description}</p>}
                {safeHttpUrl(item.url) && (
                  <a href={safeHttpUrl(item.url)!} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-semibold text-[#3C61DD] hover:underline">
                    View project<span className="sr-only">: {item.title}</span><ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
                <div className="mt-auto flex justify-end gap-1 border-t border-[#E5E7EB] pt-3">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete ${item.title}`} disabled={remove.isPending} onClick={() => setDeleteItem(item)}><Trash2 className="size-4 text-[#B42318]" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={editIndex !== null} onOpenChange={(open) => !open && dirtyGuard.confirmDiscard(closeEditor)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIndex === -1 ? "Add portfolio item" : "Edit portfolio item"}</DialogTitle>
            <DialogDescription>Use an existing project URL or image path. File upload is not available on this profile endpoint.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <SpFormField id="portfolio-title" label="Title" required>
              <Input maxLength={150} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </SpFormField>
            <SpFormField id="portfolio-description" label="Description" required>
              <Textarea maxLength={2000} rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </SpFormField>
            <SpFormField id="portfolio-url" label="Project URL" description="Optional. Must be a complete http(s) URL." error={urlError}>
              <Input type="url" maxLength={500} placeholder="https://example.com/project" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
            </SpFormField>
            <SpFormField id="portfolio-image" label="Existing image path or URL" description="Optional. This field stores a reference; it does not upload a file.">
              <Input maxLength={500} placeholder="/uploads/portfolio/example.png" value={draft.imagePath} onChange={(event) => setDraft({ ...draft, imagePath: event.target.value })} />
            </SpFormField>
            {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dirtyGuard.confirmDiscard(closeEditor)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !!urlError}>{saving ? "Saving…" : "Save item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete portfolio item?</DialogTitle>
            <DialogDescription>{deleteItem ? `“${deleteItem.title}” will be removed from your profile. This action cannot be undone.` : "This action cannot be undone."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={remove.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SpCard>
  );
}
