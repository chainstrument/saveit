"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Bookmark } from "@saveit/shared";

interface Props {
  bookmark: Bookmark;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; note: string | null; tagNames: string[] }) => Promise<void>;
}

export function EditBookmarkDialog({ bookmark, open, onOpenChange, onSave }: Props) {
  const [title, setTitle] = useState(bookmark.title);
  const [note, setNote] = useState(bookmark.note ?? "");
  const [tags, setTags] = useState(bookmark.tags.map((t) => t.name).join(", "));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(bookmark.title);
      setNote(bookmark.note ?? "");
      setTags(bookmark.tags.map((t) => t.name).join(", "));
    }
  }, [open, bookmark]);

  async function handleSave() {
    setSaving(true);
    try {
      const tagNames = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await onSave({ title, note: note || null, tagNames });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le marque-page</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Titre</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ajouter une note..."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: IA, veille, outils"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
