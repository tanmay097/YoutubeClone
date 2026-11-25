"use client";

import { IK_TR, formatCount, formatViews, timeAgo, type VideoDetail } from "@vidora/shared";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { api, imageSrc } from "@/lib/client";
import { Avatar } from "@/components/Avatar";
import { SubscribeButton } from "@/components/SubscribeButton";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection } from "@/components/CommentSection";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [subs, setSubs] = useState(0);
  const viewed = useRef<string | null>(null);

  // Re-fetch once auth resolves so likedByMe / subscribedToOwner reflect the viewer.
  useEffect(() => {
    if (authLoading) return;
    api
      .getVideo(id)
      .then(({ video }) => {
        setVideo(video);
        setSubs(video.owner.subscriberCount);
        document.title = `${video.title} · Vidora`;
      })
      .catch((e: Error) => setErr(e.message));
  }, [id, authLoading, user?.id]);

  useEffect(() => {
    if (viewed.current === id) return;
    viewed.current = id;
    api.recordView(id).catch(() => {});
  }, [id]);

  if (err) return <EmptyState title="Video unavailable" body={err} cta={{ href: "/", label: "Back to home" }} />;

  return (
    <div className="mx-auto max-w-[1280px] px-0 pb-10 sm:px-6 sm:pt-6">
      <div className="aspect-video w-full overflow-hidden bg-black sm:rounded-xl">
        {video ? (
          <video
            key={video.id}
            src={video.streamUrl}
            poster={imageSrc(video.thumbnailUrl, IK_TR.poster)}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-chip" />
        )}
      </div>

      <div className="px-4 sm:px-0">
        {video ? (
          <>
            <h1 className="mt-4 text-xl font-bold leading-snug">{video.title}</h1>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.owner.id}`} className="flex min-w-0 items-center gap-3 rounded-lg">
                  <Avatar src={video.owner.avatarUrl} name={video.owner.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold hover:underline">{video.owner.name}</p>
                    <p className="text-xs text-muted">{formatCount(subs)} subscribers</p>
                  </div>
                </Link>
                {!video.isOwner && (
                  <div className="ml-3">
                    <SubscribeButton channelId={video.owner.id} initial={video.subscribedToOwner} onCount={setSubs} />
                  </div>
                )}
              </div>
              <LikeButton videoId={video.id} initialLiked={video.likedByMe} initialCount={video.likeCount} />
            </div>

            <Description video={video} />
            <CommentSection videoId={video.id} initialCount={video.commentCount} />
          </>
        ) : (
          <div className="mt-4 space-y-3" aria-hidden>
            <div className="h-6 w-2/3 animate-pulse rounded bg-chip" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-chip" />
            <div className="h-24 animate-pulse rounded-xl bg-chip" />
          </div>
        )}
      </div>
    </div>
  );
}

function Description({ video }: { video: VideoDetail }) {
  const [open, setOpen] = useState(false);
  const long = video.description.length > 180 || video.description.split("\n").length > 3;
  return (
    <div className="mt-4 rounded-xl bg-chip p-3 text-sm">
      <p className="font-semibold">
        {formatViews(video.views)} · {timeAgo(video.createdAt)}
      </p>
      {video.description ? (
        <p className={`mt-1 whitespace-pre-wrap break-words leading-relaxed ${open ? "" : "line-clamp-3"}`}>{video.description}</p>
      ) : (
        <p className="mt-1 text-muted">No description.</p>
      )}
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 cursor-pointer font-semibold">
          {open ? "Show less" : "…more"}
        </button>
      )}
    </div>
  );
}
