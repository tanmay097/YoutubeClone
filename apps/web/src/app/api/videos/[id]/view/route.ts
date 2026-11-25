import { connectDB } from "@/lib/db";
import { Video } from "@/models";
import { handler, isId, json, notFound } from "@/lib/http";

export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/videos/[id]/view">) => {
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  await connectDB();
  const v = await Video.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true, projection: { views: 1 } });
  if (!v) return notFound("Video");
  return json({ views: v.views });
});
