import { commentSchema } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { Comment, Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { error, handler, isId, json, notFound, unauthorized, zodMessage } from "@/lib/http";
import { toComment } from "@/lib/serialize";

const AUTHOR_FIELDS = "name avatarUrl subscriberCount";

export const GET = handler(async (req: Request, ctx: RouteContext<"/api/videos/[id]/comments">) => {
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  await connectDB();
  const viewerId = await getUserId(req);
  const docs = await Comment.find({ video: id }).sort({ createdAt: -1 }).limit(200).populate("author", AUTHOR_FIELDS).lean();
  return json({ items: docs.filter((c) => c.author).map((c) => toComment(c, viewerId)) });
});

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/videos/[id]/comments">) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  const parsed = commentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return error(zodMessage(parsed.error));

  await connectDB();
  if (!(await Video.exists({ _id: id }))) return notFound("Video");
  const comment = await Comment.create({ video: id, author: userId, text: parsed.data.text });
  await Video.updateOne({ _id: id }, { $inc: { commentCount: 1 } });
  await comment.populate("author", AUTHOR_FIELDS);
  return json({ comment: toComment(comment, userId) }, 201);
});
