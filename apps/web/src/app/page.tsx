"use client";

import type { VideoSummary } from "@vidora/shared";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .listVideos()
      .then((r) => {
        setVideos(r.items);
        setCursor(r.nextCursor);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const r = await api.listVideos(cursor);
      setVideos((v) => [...(v ?? []), ...r.items]);
      setCursor(r.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor]);

  if (err) return <EmptyState title="Couldn't load videos" body={err} />;

  if (videos && videos.length === 0) {
    return (
      <EmptyState
        title="No videos yet"
        body="Be the first to share something with the world."
        cta={{ href: user ? "/upload" : "/register", label: user ? "Upload a video" : "Create an account" }}
      />
    );
  }

  return (
    <div className="px-4 pt-4 sm:px-6">
      <h1 className="sr-only">Home</h1>
      <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {videos ? videos.map((v) => <VideoCard key={v.id} video={v} />) : Array.from({ length: 12 }, (_, i) => <VideoCardSkeleton key={i} />)}
      </div>
      {cursor && (
        <div className="flex justify-center py-10">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="cursor-pointer rounded-full bg-chip px-6 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-chip-hover disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
