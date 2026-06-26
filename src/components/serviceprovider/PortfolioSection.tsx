'use client';

import { useState } from 'react';
import { ExternalLink, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import EmptyState from '@/components/ui/empty-state';
import {
  useAddPortfolioItem,
  useDeletePortfolioItem,
  useUpdatePortfolioItem,
} from '@/hooks/queries/service-provider';
import type { PortfolioItem } from '@/types/service-provider';

type Draft = { title: string; description: string; url: string };

const emptyDraft: Draft = { title: '', description: '', url: '' };

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  const add = useAddPortfolioItem();
  const update = useUpdatePortfolioItem();
  const remove = useDeletePortfolioItem();

  // editIndex: null = closed, -1 = adding, >=0 = editing that index
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setDraft(emptyDraft);
    setEditIndex(-1);
    setError(null);
  };

  const openEdit = (item: PortfolioItem) => {
    setDraft({
      title: item.title,
      description: item.description ?? '',
      url: item.url ?? '',
    });
    setEditIndex(item.index);
    setError(null);
  };

  const close = () => setEditIndex(null);

  const save = async () => {
    if (!draft.title.trim() || !draft.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim() || null,
    };
    try {
      if (editIndex === -1) {
        await add.mutateAsync(payload);
      } else if (editIndex !== null) {
        await update.mutateAsync({ index: editIndex, ...payload });
      }
      close();
    } catch {
      setError('Could not save the item. Check the fields and try again.');
    }
  };

  const saving = add.isPending || update.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Portfolio</CardTitle>
          <CardDescription>
            {items.length} item{items.length === 1 ? '' : 's'}
          </CardDescription>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No portfolio items yet"
            description="Add work samples so founders can evaluate your delivery."
            action={
              <Button onClick={openAdd} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
                Add your first item
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.index}
                className="flex flex-col rounded-lg border bg-background p-4"
              >
                <p className="font-medium text-foreground">{item.title}</p>
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
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit link
                  </a>
                )}
                <div className="mt-3 flex justify-end gap-1 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit item"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete item"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(item.index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editIndex !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editIndex === -1 ? 'Add portfolio item' : 'Edit portfolio item'}
            </DialogTitle>
            <DialogDescription>
              Title and description are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pf-title">Title</Label>
              <Input
                id="pf-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-desc">Description</Label>
              <Textarea
                id="pf-desc"
                rows={4}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-url">URL (optional)</Label>
              <Input
                id="pf-url"
                placeholder="https://…"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
