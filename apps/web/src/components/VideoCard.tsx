/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { IK_TR, formatViews, timeAgo, type VideoSummary } from "@vidora/shared";
import { imageSrc } from "@/lib/client";
import { Avatar } from "./Avatar";

export function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <article className="group">
      <Link href={`/watch/${video.id}`} className="block rounded-xl" aria-label={video.title}>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-chip">
          <img
            src={imageSrc(video.thumbnailUrl, IK_TR.card)}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="mt-3 flex gap-3">
        <Avatar src={video.owner.avatarUrl} name={video.owner.name} size={36} />
        <div className="min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{video.title}</h3>
          </Link>
          <p className="mt-1 truncate text-sm text-muted">{video.owner.name}</p>
          <p className="text-sm text-muted">
            {formatViews(video.views)} · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function VideoCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-video animate-pulse rounded-xl bg-chip" />
      <div className="mt-3 flex gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-chip" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-11/12 animate-pulse rounded bg-chip" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-chip" />
        </div>
      </div>
    </div>
  );
}
