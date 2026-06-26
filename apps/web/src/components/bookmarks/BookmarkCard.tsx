"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { Bookmark } from "@saveit/shared";
import { EditBookmarkDialog } from "./EditBookmarkDialog";

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { title?: string; note?: string | null; tagNames?: string[] }) => Promise<void>;
}

export function BookmarkCard({ bookmark, onDelete, onUpdate }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  const domain = (() => {
    try { return new URL(bookmark.url).hostname; }
    catch { return bookmark.url; }
  })();

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm leading-snug hover:underline line-clamp-2"
              >
                {bookmark.title}
              </a>
              <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                <ExternalLink className="h-3 w-3 shrink-0" />
                {domain}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(bookmark.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {bookmark.note && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{bookmark.note}</p>
          )}
        </CardContent>

        {bookmark.tags.length > 0 && (
          <CardFooter className="pt-0 pb-3 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </CardFooter>
        )}
      </Card>

      <EditBookmarkDialog
        bookmark={bookmark}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (data) => {
          await onUpdate(bookmark.id, data);
          setEditOpen(false);
        }}
      />
    </>
  );
}
