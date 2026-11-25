import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, videoBlobPrefix } from "@vidora/shared";
import { getUserId } from "@/lib/auth";
import { error, json } from "@/lib/http";

/**
 * Issues short-lived Vercel Blob client tokens so the browser/phone uploads the video straight to Blob.
 * The file never passes through this function (Vercel caps function request bodies at 4.5 MB).
 * The Video record is created afterwards by POST /api/videos, not by an upload-completed webhook,
 * so this works the same on localhost.
 */
export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return error("Please sign in to continue", 401);

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return error("Invalid upload request");
  }

  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(videoBlobPrefix(userId))) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return json(result);
  } catch (e) {
    console.error(e);
    return error((e as Error).message || "Could not start the upload", 400);
  }
}
