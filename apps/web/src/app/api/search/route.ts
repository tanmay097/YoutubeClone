import type { ChannelSummary, SearchResults } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { User, Video } from "@/models";
import { handler, json } from "@/lib/http";
import { toPublicUser, toVideoSummary } from "@/lib/serialize";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** GET /api/search?q= : channels whose name matches, plus videos whose title matches or whose channel matches. */
export const GET = handler(async (req: Request) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return json<SearchResults>({ channels: [], videos: [] });

  await connectDB();
  const re = new RegExp(escapeRegex(q), "i");
  const users = await User.find({ name: re }, { name: 1, avatarUrl: 1, subscriberCount: 1 })
    .sort({ subscriberCount: -1 })
    .limit(10)
    .lean();
  const userIds = users.map((u) => u._id);

  const [counts, videoDocs] = await Promise.all([
    Video.aggregate<{ _id: unknown; n: number }>([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: "$owner", n: { $sum: 1 } } },
    ]),
    Video.find({ $or: [{ title: re }, { owner: { $in: userIds } }] })
      .sort({ _id: -1 })
      .limit(30)
      .populate("owner", "name avatarUrl subscriberCount")
      .lean(),
  ]);
  const countBy = new Map(counts.map((c) => [String(c._id), c.n]));

  const channels: ChannelSummary[] = users.map((u) => ({
    ...toPublicUser(u),
    videoCount: countBy.get(String(u._id)) ?? 0,
  }));
  return json<SearchResults>({ channels, videos: videoDocs.map(toVideoSummary) });
});
