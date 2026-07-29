"use client";

import { useEffect, useState } from "react";
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
  useRemovePortfolioImage,
  useUpdatePortfolioItem,
  useUploadPortfolioImage,
} from "@/hooks/queries/service-provider";
import type { PortfolioItem } from "@/types/service-provider";
import { useSpDirtyFormGuard } from "@/hooks/useSpDirtyFormGuard";
import { safeHttpUrl, validateOptionalHttpUrl } from "@/lib/service-provider/url-security";
import { resolveProviderMediaUrl } from "@/lib/service-provider/provider-media";
import { ProviderImageUploader } from "./ProviderImageUploader";

type Draft = { title: string; description: string; url: string; imageCaption: string };

const emptyDraft: Draft = { title: "", description: "", url: "", imageCaption: "" };

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  const add = useAddPortfolioItem();
  const update = useUpdatePortfolioItem();
  const remove = useDeletePortfolioItem();
  const uploadImage = useUploadPortfolioImage();
  const removeImage = useRemovePortfolioImage();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const guardState = { ...draft, pendingImageKey: pendingImage ? `${pendingImage.name}:${pendingImage.size}:${pendingImage.lastModified}` : "" };
  const dirtyGuard = useSpDirtyFormGuard(guardState, { enabled: editIndex !== null });
  const urlError = validateOptionalHttpUrl(draft.url);

  useEffect(() => () => {
    if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl);
  }, [pendingImageUrl]);

  function clearPendingImage() {
    if (pendingImageUrl) URL.revokeObjectURL(pendingImageUrl);
    setPendingImageUrl(null);
    setPendingImage(null);
  }

  function openAdd() {
    setDraft(emptyDraft);
    dirtyGuard.markClean({ ...emptyDraft, pendingImageKey: "" });
    setEditIndex(-1);
    clearPendingImage();
    setError(null);
  }

  function openEdit(item: PortfolioItem) {
    const next = {
      title: item.title,
      description: item.description ?? "",
      url: item.url ?? "",
      imageCaption: item.imageCaption ?? "",
    };
    setDraft(next);
    dirtyGuard.markClean({ ...next, pendingImageKey: "" });
    setEditIndex(item.index);
    clearPendingImage();
    setError(null);
  }

  function closeEditor() {
    setEditIndex(null);
    clearPendingImage();
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
      imageCaption: draft.imageCaption,
    };
    try {
      if (editIndex === -1) {
        const savedProfile = await add.mutateAsync(payload);
        const existingIds = new Set(items.map((item) => item.id).filter(Boolean));
        const addedItem = savedProfile.portfolioItems.find((item) => item.id && !existingIds.has(item.id)) ?? savedProfile.portfolioItems.at(-1);
        if (pendingImage && addedItem?.id) {
          try {
            await uploadImage.mutateAsync({ portfolioItemId: addedItem.id, file: pendingImage, caption: draft.imageCaption.trim() || null });
            setFeedback("Portfolio item and primary image added.");
          } catch {
            setFeedback("Portfolio item was added, but its image could not be uploaded. Open the item to retry.");
          }
        } else {
          setFeedback("Portfolio item added.");
        }
      } else if (editIndex !== null) {
        await update.mutateAsync({ index: editIndex, ...payload });
        setFeedback("Portfolio item updated.");
      }
      dirtyGuard.markClean(guardState);
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

  const saving = add.isPending || update.isPending || uploadImage.isPending;

  return (
    <SpCard>
      <SpSectionHeader
        title="Portfolio"
        description={`${items.length} ${items.length === 1 ? "item" : "items"}. Upload one primary project image per item; external project URLs remain optional.`}
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
            <article key={item.id ?? `legacy-${item.index}`} className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#F4F5F7]">
                {(item.primaryImage?.url || item.imagePath) ? (
                  <img src={resolveProviderMediaUrl(item.primaryImage?.url ?? item.imagePath)!} alt={item.imageCaption?.trim() || `${item.title} project image`} className="size-full object-cover" />
                ) : <FolderOpen className="size-7 text-[#9CA3AF]" aria-hidden="true" />}
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
                  <Button variant="ghost" size="icon" className="size-11" aria-label={`Edit ${item.title}`} title={`Edit ${item.title}`} onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-11" aria-label={`Delete ${item.title}`} title={`Delete ${item.title}`} disabled={remove.isPending} onClick={() => setDeleteItem(item)}><Trash2 className="size-4 text-[#B42318]" /></Button>
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
            <DialogDescription>Add project details and a dedicated primary image. The project URL is optional and remains separate.</DialogDescription>
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
            <SpFormField id="portfolio-image-caption" label="Image caption or accessible description" description="Describe the project image when it conveys useful information.">
              <Input maxLength={300} value={draft.imageCaption} onChange={(event) => setDraft({ ...draft, imageCaption: event.target.value })} />
            </SpFormField>
            {editIndex !== null && (() => {
              const currentItem = editIndex >= 0 ? items.find((item) => item.index === editIndex) : undefined;
              const currentUrl = pendingImageUrl ?? resolveProviderMediaUrl(currentItem?.primaryImage?.url ?? currentItem?.imagePath);
              return (
                <ProviderImageUploader
                  compact
                  kind="portfolio"
                  label="Primary project image"
                  currentUrl={currentUrl}
                  currentAlt={draft.imageCaption || (draft.title ? `${draft.title} project image` : "Project image preview")}
                  successMessage={editIndex === -1 ? "Primary image prepared. Save the item to upload it." : undefined}
                  onUpload={async (file, onProgress) => {
                    if (editIndex === -1) {
                      clearPendingImage();
                      setPendingImage(file);
                      setPendingImageUrl(URL.createObjectURL(file));
                      onProgress(100);
                      return;
                    }
                    if (!currentItem?.id) throw new Error("This legacy portfolio item needs a stable server identity before its image can be changed. Refresh and retry.");
                    await uploadImage.mutateAsync({ portfolioItemId: currentItem.id, file, caption: draft.imageCaption.trim() || null, onProgress });
                  }}
                  onRemove={async () => {
                    if (pendingImageUrl) {
                      clearPendingImage();
                      return;
                    }
                    if (!currentItem?.id) throw new Error("This legacy portfolio item needs a stable server identity before its image can be changed. Refresh and retry.");
                    await removeImage.mutateAsync(currentItem.id);
                  }}
                />
              );
            })()}
            <p className="text-xs leading-5 text-[#6B7280]">Basic file validation is active. Production security scanning is not yet enabled.</p>
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
