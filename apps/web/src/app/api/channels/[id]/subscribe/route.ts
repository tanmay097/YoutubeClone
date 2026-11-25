import { connectDB } from "@/lib/db";
import { Subscription, User } from "@/models";
import { getUserId } from "@/lib/auth";
import { error, handler, isId, json, notFound, unauthorized } from "@/lib/http";

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/channels/[id]/subscribe">) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Channel");
  if (id === userId) return error("You can't subscribe to your own channel");
  await connectDB();
  if (!(await User.exists({ _id: id }))) return notFound("Channel");

  const removed = await Subscription.findOneAndDelete({ subscriber: userId, channel: id });
  let subscribed: boolean;
  if (removed) {
    subscribed = false;
    await User.updateOne({ _id: id, subscriberCount: { $gt: 0 } }, { $inc: { subscriberCount: -1 } });
  } else {
    subscribed = true;
    try {
      await Subscription.create({ subscriber: userId, channel: id });
      await User.updateOne({ _id: id }, { $inc: { subscriberCount: 1 } });
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e;
    }
  }
  const channel = await User.findById(id, { subscriberCount: 1 }).lean();
  return json({ subscribed, subscriberCount: channel?.subscriberCount ?? 0 });
});
