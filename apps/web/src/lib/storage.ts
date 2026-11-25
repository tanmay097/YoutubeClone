import path from "node:path";
import fs from "node:fs";

/** Videos live outside /public so they are only reachable through the Range-aware stream route. */
export function uploadDir() {
  const dir = process.env.UPLOAD_DIR || path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../../uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function videoPath(fileName: string) {
  // fileName is generated server-side (uuid + ext); basename guards against traversal anyway.
  return path.join(/*turbopackIgnore: true*/ uploadDir(), path.basename(fileName));
}

export const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};
