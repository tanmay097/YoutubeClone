import { connectDB } from "@/lib/db";
import { Comment, Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { error, handler, isId, json, notFound, unauthorized } from "@/lib/http";

export const DELETE = handler(async (req: Request, ctx: RouteContext<"/api/comments/[id]">) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Comment");
  await connectDB();
  const comment = await Comment.findById(id);
  if (!comment) return notFound("Comment");
  if (String(comment.author) !== userId) return error("You can only delete your own comments", 403);
  await comment.deleteOne();
  await Video.updateOne({ _id: comment.video, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
  return json({ ok: true });
});
