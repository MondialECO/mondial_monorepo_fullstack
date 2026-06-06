'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            title="No portfolio items yet"
            description="Add work samples so founders can evaluate your delivery."
          />
        ) : (
          items.map((item) => (
            <div
              key={item.index}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-2"
                  >
                    {item.url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit item"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete item"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
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
