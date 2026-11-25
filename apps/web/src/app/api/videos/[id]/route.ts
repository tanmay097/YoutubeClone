import type { VideoDetail } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { Like, Subscription, Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { handler, isId, json, notFound } from "@/lib/http";
import { toVideoSummary } from "@/lib/serialize";

export const GET = handler(async (req: Request, ctx: RouteContext<"/api/videos/[id]">) => {
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  await connectDB();
  const v = await Video.findById(id).populate("owner", "name avatarUrl subscriberCount").lean();
  if (!v) return notFound("Video");

  const viewerId = await getUserId(req);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = String((v.owner as any)._id);
  const [liked, subscribed] = viewerId
    ? await Promise.all([
        Like.exists({ user: viewerId, video: id }),
        Subscription.exists({ subscriber: viewerId, channel: ownerId }),
      ])
    : [null, null];

  const video: VideoDetail = {
    ...toVideoSummary(v),
    description: v.description ?? "",
    streamUrl: `/api/videos/${id}/stream`,
    likedByMe: !!liked,
    subscribedToOwner: !!subscribed,
    isOwner: viewerId === ownerId,
  };
  return json({ video });
});
