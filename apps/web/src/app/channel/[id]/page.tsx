"use client";

import { formatCount, type ChannelDetail, type VideoSummary } from "@vidora/shared";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/Avatar";
import { SubscribeButton } from "@/components/SubscribeButton";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [videos, setVideos] = useState<VideoSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [subs, setSubs] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Re-fetch once auth resolves so subscribedByMe reflects the viewer.
  useEffect(() => {
    if (authLoading) return;
    api
      .getChannel(id)
      .then((r) => {
        setChannel(r.channel);
        setSubs(r.channel.subscriberCount);
        setVideos(r.videos.items);
        setCursor(r.videos.nextCursor);
        document.title = `${r.channel.name} · Vidora`;
      })
      .catch((e: Error) => setErr(e.message));
  }, [id, authLoading, user?.id]);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const r = await api.getChannel(id, cursor);
      setVideos((v) => [...(v ?? []), ...r.videos.items]);
      setCursor(r.videos.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [id, cursor]);

  if (err) return <EmptyState title="Channel unavailable" body={err} cta={{ href: "/", label: "Back to home" }} />;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-6">
      {channel ? (
        <header className="flex flex-col items-start gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:gap-6">
          <Avatar src={channel.avatarUrl} name={channel.name} size={120} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-extrabold tracking-tight">{channel.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {formatCount(subs)} subscribers · {channel.videoCount} {channel.videoCount === 1 ? "video" : "videos"}
            </p>
            <div className="mt-4">
              {channel.isMe ? (
                <Link
                  href="/upload"
                  className="inline-flex h-9 items-center rounded-full bg-chip px-4 text-sm font-semibold transition-colors duration-200 hover:bg-chip-hover"
                >
                  Upload video
                </Link>
              ) : (
                <SubscribeButton key={`${channel.id}-${channel.subscribedByMe}`} channelId={channel.id} initial={channel.subscribedByMe} onCount={setSubs} />
              )}
            </div>
          </div>
        </header>
      ) : (
        <div className="flex items-center gap-6 border-b border-line pb-6" aria-hidden>
          <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-chip" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-1/3 animate-pulse rounded bg-chip" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-chip" />
          </div>
        </div>
      )}

      <h2 className="mt-6 mb-4 text-lg font-bold">Videos</h2>
      {videos && videos.length === 0 ? (
        <p className="py-10 text-center text-muted">This channel hasn&apos;t uploaded any videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {videos ? videos.map((v) => <VideoCard key={v.id} video={v} />) : Array.from({ length: 8 }, (_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      )}
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
