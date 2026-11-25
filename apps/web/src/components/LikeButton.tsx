"use client";

import { formatCount } from "@vidora/shared";
import { useState } from "react";
import { api } from "@/lib/client";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { IKIcon } from "./IKIcon";

export function LikeButton({ videoId, initialLiked, initialCount }: { videoId: string; initialLiked: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const requireAuth = useRequireAuth();

  async function toggle() {
    if (!requireAuth() || busy) return;
    setBusy(true);
    const prev = { liked, count };
    setLiked(!liked);
    setCount(count + (liked ? -1 : 1));
    try {
      const r = await api.toggleLike(videoId);
      setLiked(r.liked);
      setCount(r.likeCount);
    } catch {
      setLiked(prev.liked);
      setCount(prev.count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this video" : "Like this video"}
      className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-chip px-4 text-sm font-semibold transition-colors duration-200 hover:bg-chip-hover"
    >
      <IKIcon name={liked ? "liked" : "like"} size={20} />
      {formatCount(count)}
    </button>
  );
}
