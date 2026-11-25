import type { CommentItem, PublicUser, VideoSummary } from "@vidora/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

export function toPublicUser(u: Doc, includeEmail = false): PublicUser {
  return {
    id: String(u._id),
    name: u.name,
    avatarUrl: u.avatarUrl || "",
    subscriberCount: u.subscriberCount ?? 0,
    ...(includeEmail ? { email: u.email } : {}),
  };
}

export function toVideoSummary(v: Doc): VideoSummary {
  return {
    id: String(v._id),
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    views: v.views ?? 0,
    likeCount: v.likeCount ?? 0,
    commentCount: v.commentCount ?? 0,
    createdAt: new Date(v.createdAt).toISOString(),
    owner: toPublicUser(v.owner),
  };
}

export function toComment(c: Doc, viewerId: string | null): CommentItem {
  return {
    id: String(c._id),
    text: c.text,
    createdAt: new Date(c.createdAt).toISOString(),
    author: toPublicUser(c.author),
    isMine: viewerId !== null && String(c.author._id) === viewerId,
  };
}
