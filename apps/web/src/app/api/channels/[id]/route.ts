import type { ChannelDetail } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { Subscription, User, Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { handler, isId, json, notFound } from "@/lib/http";
import { toPublicUser, toVideoSummary } from "@/lib/serialize";

const PAGE_SIZE = 24;

/** GET /api/channels/:id?cursor= : channel profile plus its videos, newest first. */
export const GET = handler(async (req: Request, ctx: RouteContext<"/api/channels/[id]">) => {
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Channel");
  const cursor = new URL(req.url).searchParams.get("cursor");
  await connectDB();

  const user = await User.findById(id, { name: 1, avatarUrl: 1, subscriberCount: 1 }).lean();
  if (!user) return notFound("Channel");

  const viewerId = await getUserId(req);
  const filter = cursor && isId(cursor) ? { owner: id, _id: { $lt: cursor } } : { owner: id };
  const [videoCount, docs, subscribed] = await Promise.all([
    Video.countDocuments({ owner: id }),
    Video.find(filter)
      .sort({ _id: -1 })
      .limit(PAGE_SIZE + 1)
      .populate("owner", "name avatarUrl subscriberCount")
      .lean(),
    viewerId && viewerId !== id ? Subscription.exists({ subscriber: viewerId, channel: id }) : null,
  ]);

  const hasMore = docs.length > PAGE_SIZE;
  const items = docs.slice(0, PAGE_SIZE).map(toVideoSummary);
  const channel: ChannelDetail = {
    ...toPublicUser(user),
    videoCount,
    subscribedByMe: !!subscribed,
    isMe: viewerId === id,
  };
  return json({ channel, videos: { items, nextCursor: hasMore ? items[items.length - 1].id : null } });
});
