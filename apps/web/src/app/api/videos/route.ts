import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebStream } from "node:stream/web";
import Busboy from "busboy";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, videoMetaSchema } from "@vidora/shared";
import { connectDB } from "@/lib/db";
import { Video } from "@/models";
import { getUserId } from "@/lib/auth";
import { error, handler, isId, json, unauthorized, zodMessage } from "@/lib/http";
import { toVideoSummary } from "@/lib/serialize";
import { EXT_BY_MIME, videoPath } from "@/lib/storage";
import { isImageKitUrl } from "@/lib/imagekit";

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

type ParsedUpload = { fields: Record<string, string>; fileName: string; mimeType: string; size: number };

function parseUpload(req: Request): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) return reject(new UploadError("Expected multipart form data"));
    if (!req.body) return reject(new UploadError("Empty request body"));

    const bb = Busboy({ headers: { "content-type": contentType }, limits: { files: 1, fileSize: MAX_VIDEO_BYTES } });
    const fields: Record<string, string> = {};
    let saved: { fileName: string; mimeType: string; size: number } | null = null;
    let writeDone: Promise<void> | null = null;
    let failed: Error | null = null;

    bb.on("field", (name, value) => (fields[name] = value));
    bb.on("file", (_name, stream, info) => {
      if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(info.mimeType)) {
        failed = new UploadError("Only MP4, WebM or MOV videos are allowed");
        stream.resume();
        return;
      }
      const fileName = `${randomUUID()}${EXT_BY_MIME[info.mimeType]}`;
      const target = videoPath(fileName);
      let size = 0;
      stream.on("data", (chunk: Buffer) => (size += chunk.length));
      stream.on("limit", () => {
        failed = new UploadError(`Video must be under ${MAX_VIDEO_BYTES / 1024 / 1024} MB`, 413);
      });
      writeDone = pipeline(stream, fs.createWriteStream(target)).then(() => {
        saved = { fileName, mimeType: info.mimeType, size };
      });
    });
    bb.on("error", reject);
    bb.on("close", async () => {
      try {
        await writeDone;
      } catch (e) {
        failed = failed ?? (e as Error);
      }
      const s = saved as { fileName: string; mimeType: string; size: number } | null;
      if (failed) {
        if (s) fs.rm(videoPath(s.fileName), { force: true }, () => {});
        return reject(failed);
      }
      if (!s) return reject(new UploadError("Please choose a video file"));
      resolve({ fields, ...s });
    });

    Readable.fromWeb(req.body as unknown as NodeWebStream).pipe(bb);
  });
}

class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const POST = handler(async (req: Request) => {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  let upload: ParsedUpload;
  try {
    upload = await parseUpload(req);
  } catch (e) {
    if (e instanceof UploadError) return error(e.message, e.status);
    throw e;
  }

  const meta = videoMetaSchema.safeParse(upload.fields);
  const fail = (msg: string) => {
    fs.rm(videoPath(upload.fileName), { force: true }, () => {});
    return error(msg);
  };
  if (!meta.success) return fail(zodMessage(meta.error));
  if (!isImageKitUrl(meta.data.thumbnailUrl)) return fail("Thumbnail must be uploaded to ImageKit");

  await connectDB();
  const video = await Video.create({
    ...meta.data,
    owner: userId,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    size: upload.size,
  });
  await video.populate("owner", "name avatarUrl subscriberCount");
  return json({ video: toVideoSummary(video) }, 201);
});
