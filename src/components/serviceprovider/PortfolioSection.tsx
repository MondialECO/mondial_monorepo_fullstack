"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import {
  findAddedPortfolioItem,
  isPortfolioFull,
  MAX_PORTFOLIO_ITEMS,
} from "@/lib/service-provider/portfolio";
import { ProviderImageUploader } from "./ProviderImageUploader";

type Draft = { title: string; description: string; url: string; imageCaption: string };

const emptyDraft: Draft = { title: "", description: "", url: "", imageCaption: "" };

/** Editor sentinel for "adding a new item" — no server id exists yet. */
const ADD_MODE = "__add__";

type Props = {
  items?: PortfolioItem[] | null;
  /**
   * Every mutation here is scoped server-side to the *authenticated* provider,
   * not to the profile being viewed. Showing these controls to a visitor would
   * therefore edit or delete the visitor's own portfolio, so ownership is a
   * required prop rather than an optional one with a permissive default.
   */
  isOwner: boolean;
};

export function PortfolioSection({ items = [], isOwner }: Props) {
  const safeItems = items ?? [];
  const add = useAddPortfolioItem();
  const update = useUpdatePortfolioItem();
  const remove = useDeletePortfolioItem();
  const uploadImage = useUploadPortfolioImage();
  const removeImage = useRemovePortfolioImage();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const guardState = { ...draft, pendingImageKey: pendingImage ? `${pendingImage.name}:${pendingImage.size}:${pendingImage.lastModified}` : "" };
  const dirtyGuard = useSpDirtyFormGuard(guardState, { enabled: isOwner && editId !== null });
  const urlError = validateOptionalHttpUrl(draft.url);
  const isFull = isPortfolioFull(safeItems);

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
    setEditId(ADD_MODE);
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
    setEditId(item.id);
    clearPendingImage();
    setError(null);
  }

  function closeEditor() {
    setEditId(null);
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
      imageCaption: draft.imageCaption.trim() || null,
    };
    try {
      if (editId === ADD_MODE) {
        const savedProfile = await add.mutateAsync(payload);
        // Match the new item by id diff. When that is ambiguous we do not guess:
        // attaching the image to the wrong item is worse than asking for a retry.
        const addedItem = findAddedPortfolioItem(safeItems, savedProfile?.portfolioItems ?? []);
        if (pendingImage && addedItem) {
          try {
            await uploadImage.mutateAsync({ portfolioItemId: addedItem.id, file: pendingImage, caption: payload.imageCaption });
            setFeedback("Portfolio item and primary image added.");
          } catch {
            setFeedback("Portfolio item was added, but its image could not be uploaded. Open the item to retry.");
          }
        } else if (pendingImage) {
          setFeedback("Portfolio item was added, but its image could not be matched to it. Open the item to add the image.");
        } else {
          setFeedback("Portfolio item added.");
        }
      } else if (editId !== null) {
        await update.mutateAsync({ id: editId, ...payload });
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
      await remove.mutateAsync(deleteItem.id);
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
        description={
          isOwner
            ? `${safeItems.length} of ${MAX_PORTFOLIO_ITEMS} items. Upload one primary project image per item; external project URLs remain optional.`
            : `${safeItems.length} ${safeItems.length === 1 ? "item" : "items"}.`
        }
        action={
          isOwner ? (
            <Button onClick={openAdd} size="sm" disabled={isFull}>
              <Plus className="size-4" />Add item
            </Button>
          ) : undefined
        }
      />

      {isOwner && isFull && (
        <SpMutationFeedback status="error" className="mt-5">
          You have reached the {MAX_PORTFOLIO_ITEMS}-item limit. Remove an item before adding another.
        </SpMutationFeedback>
      )}

      {isOwner && feedback && (
        <SpMutationFeedback status={feedback.includes("could not") ? "error" : "success"} className="mt-5">
          {feedback}
        </SpMutationFeedback>
      )}

      {safeItems.length === 0 ? (
        <SpEmptyState
          className="mt-5 min-h-52"
          icon={FolderOpen}
          title={isOwner ? "No portfolio items yet" : "No portfolio items"}
          description={
            isOwner
              ? "Add real work samples so clients can evaluate your delivery."
              : "This provider has not published any work samples."
          }
          action={
            isOwner ? (
              <Button onClick={openAdd} size="sm" variant="outline"><Plus className="size-4" />Add your first item</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {safeItems.map((item) => {
            const imageUrl = resolveProviderMediaUrl(item.primaryImage?.url ?? item.imagePath);
            return (
              <article key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted">
                  {imageUrl ? (
                    // Provider media is served from the API origin, which is
                    // environment-dependent and absent from next.config
                    // remotePatterns; unoptimized keeps next/image from failing
                    // on it at runtime while still giving us lazy loading.
                    <Image
                      src={imageUrl}
                      alt={item.imageCaption?.trim() || `${item.title} project image`}
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <FolderOpen className="size-7 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
                  {item.description && <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>}
                  {safeHttpUrl(item.url) && (
                    <a href={safeHttpUrl(item.url)!} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      View project<span className="sr-only">: {item.title}</span><ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {isOwner && (
                    <div className="mt-auto flex justify-end gap-1 border-t border-border pt-3">
                      <Button variant="ghost" size="icon" className="size-11" aria-label={`Edit ${item.title}`} title={`Edit ${item.title}`} onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-11" aria-label={`Delete ${item.title}`} title={`Delete ${item.title}`} disabled={remove.isPending} onClick={() => setDeleteItem(item)}><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isOwner && (
        <>
          <Dialog open={editId !== null} onOpenChange={(open) => !open && dirtyGuard.confirmDiscard(closeEditor)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId === ADD_MODE ? "Add portfolio item" : "Edit portfolio item"}</DialogTitle>
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
                {editId !== null && (() => {
                  const currentItem = editId === ADD_MODE ? undefined : safeItems.find((item) => item.id === editId);
                  const currentUrl = pendingImageUrl ?? resolveProviderMediaUrl(currentItem?.primaryImage?.url ?? currentItem?.imagePath);
                  return (
                    <ProviderImageUploader
                      compact
                      kind="portfolio"
                      label="Primary project image"
                      currentUrl={currentUrl}
                      currentAlt={draft.imageCaption || (draft.title ? `${draft.title} project image` : "Project image preview")}
                      successMessage={editId === ADD_MODE ? "Primary image prepared. Save the item to upload it." : undefined}
                      onUpload={async (file, onProgress) => {
                        if (editId === ADD_MODE) {
                          clearPendingImage();
                          setPendingImage(file);
                          setPendingImageUrl(URL.createObjectURL(file));
                          onProgress(100);
                          return;
                        }
                        if (!currentItem) throw new Error("This portfolio item is no longer available. Refresh and retry.");
                        await uploadImage.mutateAsync({ portfolioItemId: currentItem.id, file, caption: draft.imageCaption.trim() || null, onProgress });
                      }}
                      onRemove={async () => {
                        if (pendingImageUrl) {
                          clearPendingImage();
                          return;
                        }
                        if (!currentItem) throw new Error("This portfolio item is no longer available. Refresh and retry.");
                        await removeImage.mutateAsync(currentItem.id);
                      }}
                    />
                  );
                })()}
                <p className="text-xs leading-5 text-muted-foreground">Basic file validation is active. Production security scanning is not yet enabled.</p>
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
                <DialogDescription>
                  {deleteItem
                    ? `“${deleteItem.title}” and its image will be permanently removed from your profile. This action cannot be undone.`
                    : "This action cannot be undone."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={remove.isPending}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete item"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </SpCard>
  );
}
