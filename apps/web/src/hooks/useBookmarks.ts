"use client";

import { useCallback, useEffect, useState } from "react";
import type { Bookmark } from "@saveit/shared";

const PAGE_SIZE = 20;

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch_ = useCallback(async (reset = false) => {
    const targetPage = reset ? 1 : page;
    if (reset) { setPage(1); setBookmarks([]); }
    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookmarks?page=${targetPage}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json = await res.json();
      setTotal(json.pagination.total);
      setTotalPages(json.pagination.totalPages);
      setBookmarks((prev) => reset ? json.data : [...prev, ...json.data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => { fetch_(true); }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      setPage((p) => p + 1);
    }
  }, [page, totalPages, loadingMore]);

  useEffect(() => {
    if (page > 1) fetch_();
  }, [page]);

  const deleteBookmark = useCallback(async (id: string) => {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    setTotal((t) => t - 1);
  }, []);

  const updateBookmark = useCallback(async (id: string, data: { title?: string; note?: string | null; tagNames?: string[] }) => {
    const res = await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour");
    await fetch_(true);
  }, []);

  return {
    bookmarks, loading, loadingMore, error, total, totalPages, page,
    hasMore: page < totalPages,
    loadMore,
    refresh: () => fetch_(true),
    deleteBookmark,
    updateBookmark,
  };
}
