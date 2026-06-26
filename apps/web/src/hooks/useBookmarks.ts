"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bookmark } from "@saveit/shared";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setBookmarks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const deleteBookmark = useCallback(async (id: string) => {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBookmark = useCallback(async (id: string, data: { title?: string; note?: string | null; tagNames?: string[] }) => {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour");
    await fetch_();
  }, [fetch_]);

  return { bookmarks, loading, error, refresh: fetch_, deleteBookmark, updateBookmark };
}
