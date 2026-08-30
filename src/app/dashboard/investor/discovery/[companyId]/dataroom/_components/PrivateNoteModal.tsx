"use client";

import { useState } from "react";
import { Lock, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  usePrivateNotes,
  useCreatePrivateNote,
  useDeletePrivateNote,
} from "@/hooks/queries/investor-diligence";

interface PrivateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  documentId?: string | null;
  documentTitle?: string | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function PrivateNoteModal({
  isOpen,
  onClose,
  companyId,
  documentId,
  documentTitle,
}: PrivateNoteModalProps) {
  const [content, setContent] = useState("");
  const { data: notes, isLoading: notesLoading } = usePrivateNotes(
    isOpen ? companyId : null,
    documentId || undefined
  );
  const createMutation = useCreatePrivateNote(companyId);
  const deleteMutation = useDeletePrivateNote(companyId);

  async function handleSave() {
    if (!content.trim()) return;
    await createMutation.mutateAsync({
      documentId: documentId || undefined,
      content: content.trim(),
    });
    setContent("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-4 w-4" />
            <DialogTitle>Private Investor Note</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {documentTitle ? `Attached to: ${documentTitle}. ` : ""}
            Only you and authorized members of your investor entity can see these notes. The founder will never see them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Textarea
              placeholder="Write your private observation, valuation concern, or thesis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!content.trim() || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Add Note
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Existing Notes ({notes?.length ?? 0})
            </h4>

            {notesLoading ? (
              <div className="py-4 text-center text-xs text-muted-foreground">Loading notes...</div>
            ) : !notes || notes.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground italic">
                No private notes added yet.
              </div>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="whitespace-pre-wrap text-foreground">{note.content}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(note.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
