import { head, type HeadBlobResult } from "@vercel/blob";
import { videoBlobPrefix } from "@vidora/shared";

/**
 * Confirms a client-supplied URL is a blob in *our* store that this user uploaded, and returns its real
 * size/content type (never trust the client for those). Returns null if it isn't.
 */
export async function ownVideoBlob(url: string, userId: string): Promise<HeadBlobResult | null> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!host.endsWith(".public.blob.vercel-storage.com")) return null;
  try {
    const blob = await head(url);
    return blob.pathname.startsWith(videoBlobPrefix(userId)) ? blob : null;
  } catch {
    return null; // BlobNotFoundError, or a URL from a different store
  }
}
