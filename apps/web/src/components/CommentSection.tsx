"use client";

import { formatCount, timeAgo, type CommentItem } from "@vidora/shared";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/client";
import { Avatar } from "./Avatar";
import { IKIcon } from "./IKIcon";
import { useAuth } from "./AuthProvider";

export function CommentSection({ videoId, initialCount }: { videoId: string; initialCount: number }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listComments(videoId).then((r) => setComments(r.items)).catch(() => setComments([]));
  }, [videoId, user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setErr(null);
    try {
      const { comment } = await api.addComment(videoId, text);
      setComments((c) => [comment, ...(c ?? [])]);
      setCount((n) => n + 1);
      setText("");
      setFocused(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: string) {
    const before = comments;
    setComments((c) => c?.filter((x) => x.id !== id) ?? null);
    setCount((n) => Math.max(0, n - 1));
    try {
      await api.deleteComment(id);
    } catch {
      setComments(before);
      setCount((n) => n + 1);
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-6">
      <h2 id="comments-heading" className="text-xl font-bold">
        {formatCount(count)} {count === 1 ? "Comment" : "Comments"}
      </h2>

      {user ? (
        <form onSubmit={submit} className="mt-5 flex gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size={40} />
          <div className="flex-1">
            <label htmlFor="comment" className="sr-only">Add a comment</label>
            <textarea
              id="comment"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              rows={focused ? 2 : 1}
              maxLength={1000}
              placeholder="Add a comment…"
              className="w-full resize-none border-b border-line bg-transparent pb-1 text-sm outline-none transition-colors placeholder:text-muted focus:border-fg"
            />
            {err && <p role="alert" className="mt-1 text-sm text-danger">{err}</p>}
            {focused && (
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setText(""); setFocused(false); }}
                  className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold hover:bg-chip"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || posting}
                  className="cursor-pointer rounded-full bg-link px-4 py-2 text-sm font-semibold text-bg transition-opacity disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted"
                >
                  {posting ? "Posting…" : "Comment"}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mt-5 text-sm text-muted">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-semibold text-link hover:underline">Sign in</Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="mt-6 space-y-6">
        {comments === null
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="flex gap-3" aria-hidden>
                <div className="h-10 w-10 animate-pulse rounded-full bg-chip" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-chip" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-chip" />
                </div>
              </li>
            ))
          : comments.map((c) => (
              <li key={c.id} className="group flex gap-3">
                <Avatar src={c.author.avatarUrl} name={c.author.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]">
                    <span className="font-semibold">@{c.author.name}</span>{" "}
                    <span className="text-muted">{timeAgo(c.createdAt)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{c.text}</p>
                </div>
                {c.isMine && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label="Delete comment"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full opacity-100 transition-opacity hover:bg-chip md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  >
                    <IKIcon name="trash" size={18} />
                  </button>
                )}
              </li>
            ))}
      </ul>
    </section>
  );
}
