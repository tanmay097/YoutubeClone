import { del } from "@vercel/blob";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, createVideoSchema } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { error, handler, isId, json, unauthorized, zodMessage } from "@/lib/http";
import { toVideoSummary } from "@/lib/serialize";
import { isImageKitUrl } from "@/lib/imagekit";
import { ownVideoBlob } from "@/lib/blob";

const PAGE_SIZE = 24;

export const GET = handler(async (req: Request) => {
  const cursor = new URL(req.url).searchParams.get("cursor");
  await connectDB();
  const filter = cursor && isId(cursor) ? { _id: { $lt: cursor } } : {};
  const docs = await Video.find(filter)
    .sort({ _id: -1 })
    .limit(PAGE_SIZE + 1)
    .populate("owner", "name avatarUrl subscriberCount")
    .lean();
  const hasMore = docs.length > PAGE_SIZE;
  const items = docs.slice(0, PAGE_SIZE).map(toVideoSummary);
  return json({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
});

/** Creates the Video record once the client has uploaded the file to Vercel Blob (see /api/videos/upload). */
export const POST = handler(async (req: Request) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const parsed = createVideoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(zodMessage(parsed.error));
  const { videoUrl, ...meta } = parsed.data;
  if (!isImageKitUrl(meta.thumbnailUrl)) return error("Thumbnail must be uploaded to ImageKit");

  const blob = await ownVideoBlob(videoUrl, userId);
  if (!blob) return error("Video upload not found. Please upload it again.");
  // The upload token already enforces these; re-check so a bad blob never becomes a Video.
  if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(blob.contentType) || blob.size > MAX_VIDEO_BYTES) {
    await del(blob.url).catch(() => {});
    return error("Only MP4, WebM or MOV videos under 500 MB are allowed");
  }

  await connectDB();
  if (await Video.exists({ videoUrl: blob.url })) return error("This video has already been published", 409);
  const video = await Video.create({
    ...meta,
    owner: userId,
    videoUrl: blob.url,
    mimeType: blob.contentType,
    size: blob.size,
  });
  await video.populate("owner", "name avatarUrl subscriberCount");
  return json({ video: toVideoSummary(video) }, 201);
});
