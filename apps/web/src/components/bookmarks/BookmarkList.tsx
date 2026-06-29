"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { BookmarkCard } from "./BookmarkCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Tag } from "@saveit/shared";

export function BookmarkList() {
  const { bookmarks, loading, loadingMore, error, total, hasMore, loadMore, deleteBookmark, updateBookmark } = useBookmarks();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const allTags = useMemo<Tag[]>(() => {
    const seen = new Map<string, Tag>();
    for (const b of bookmarks) {
      for (const tag of b.tags) {
        if (!seen.has(tag.id)) seen.set(tag.id, tag);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookmarks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookmarks.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.note?.toLowerCase().includes(q) ?? false);

      const matchesTags =
        selectedTags.size === 0 ||
        b.tags.some((t) => selectedTags.has(t.id));

      return matchesSearch && matchesTags;
    });
  }, [bookmarks, search, selectedTags]);

  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filtres tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.has(tag.id) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">
          {bookmarks.length === 0
            ? "Aucun marque-page pour l'instant. Utilisez l'extension pour en sauvegarder."
            : "Aucun résultat pour cette recherche."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => (
            <BookmarkCard
              key={b.id}
              bookmark={b}
              onDelete={deleteBookmark}
              onUpdate={updateBookmark}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} marque-page{filtered.length > 1 ? "s" : ""}
          {selectedTags.size > 0 || search ? ` (filtré${filtered.length > 1 ? "s" : ""})` : ""}
          {total > bookmarks.length ? ` · ${bookmarks.length}/${total} chargés` : ""}
        </p>
      )}

      {hasMore && !search && selectedTags.size === 0 && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Chargement..." : "Charger plus"}
        </button>
      )}
    </div>
  );
}
