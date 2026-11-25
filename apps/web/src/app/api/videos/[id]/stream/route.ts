import fs from "node:fs";
import { Readable } from "node:stream";
import { connectDB } from "@/lib/db";
import { Video } from "@/models";
import { error, handler, isId, notFound } from "@/lib/http";
import { videoPath } from "@/lib/storage";

// Each ranged response is capped at 2 MB and sent as a Buffer so it carries an exact Content-Length
// (streamed bodies go out chunked, which Safari/iOS AVPlayer handle poorly). Players request the next range.
const CHUNK = 2 * 1024 * 1024;

export const GET = handler(async (req: Request, ctx: RouteContext<"/api/videos/[id]/stream">) => {
  const { id } = await ctx.params;
  if (!isId(id)) return notFound("Video");
  await connectDB();
  const video = await Video.findById(id, { fileName: 1, mimeType: 1 }).lean();
  if (!video) return notFound("Video");

  const file = videoPath(video.fileName);
  let size: number;
  try {
    size = (await fs.promises.stat(file)).size;
  } catch {
    return notFound("Video file");
  }

  const baseHeaders = {
    "Content-Type": video.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  };
  const range = req.headers.get("range");

  if (!range) {
    const body = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
    return new Response(body, { status: 200, headers: { ...baseHeaders, "Content-Length": String(size) } });
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (m[1] === "" && m[2] === "")) return error("Malformed Range header", 416);
  let start: number;
  let end: number;
  if (m[1] === "") {
    // suffix range: last N bytes
    start = Math.max(0, size - Number(m[2]), size - CHUNK);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = Math.min(m[2] ? Number(m[2]) : size - 1, start + CHUNK - 1, size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const length = end - start + 1;
  const buf = Buffer.alloc(length);
  const fh = await fs.promises.open(file, "r");
  try {
    await fh.read(buf, 0, length, start);
  } finally {
    await fh.close();
  }
  return new Response(new Uint8Array(buf), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(length),
    },
  });
});
