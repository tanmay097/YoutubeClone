import { connectDB } from "@/lib/db";
import { Like, Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { handler, isId, json, notFound, unauthorized } from "@/lib/http";

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/videos/[id]/like">) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  await connectDB();
  if (!(await Video.exists({ _id: id }))) return notFound("Video");

  const removed = await Like.findOneAndDelete({ user: userId, video: id });
  let liked: boolean;
  if (removed) {
    liked = false;
    await Video.updateOne({ _id: id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
  } else {
    liked = true;
    try {
      await Like.create({ user: userId, video: id });
      await Video.updateOne({ _id: id }, { $inc: { likeCount: 1 } });
    } catch (e) {
      // duplicate key from a concurrent double-click: already liked, counter already bumped
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  const v = await Video.findById(id, { likeCount: 1 }).lean();
  return json({ liked, likeCount: Math.max(0, v?.likeCount ?? 0) });
});
