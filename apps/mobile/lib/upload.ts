import { upload } from "@vercel/blob/client";
import { videoBlobPathname } from "@vidora/shared";
import { API_URL } from "./config";
import { api, tokenStore } from "./api";

export type PickedFile = { uri: string; name: string; type: string };

/** React Native's FormData accepts { uri, name, type } objects for files. */
const rnFile = (f: PickedFile) => f as unknown as Blob;

export async function uploadImageToImageKit(file: PickedFile, folder: string): Promise<string> {
  const auth = await api.imagekitAuth();
  const form = new FormData();
  form.append("file", rnFile(file));
  form.append("fileName", file.name);
  form.append("folder", folder);
  form.append("publicKey", auth.publicKey);
  form.append("signature", auth.signature);
  form.append("expire", String(auth.expire));
  form.append("token", auth.token);
  form.append("useUniqueFileName", "true");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body: form });
  const body = await res.json();
  if (!res.ok || !body.url) throw new Error(body.message || "ImageKit upload failed");
  return body.url as string;
}

/**
 * Uploads the video straight to Vercel Blob (our API only signs a token, authorised by the bearer header),
 * then creates the Video record. Single PUT rather than multipart: multipart relies on ReadableStream,
 * which React Native doesn't fully support; the SDK uses XHR here, so progress events still work.
 */
export async function uploadVideo(
  userId: string,
  fields: { title: string; description: string; thumbnailUrl: string },
  video: PickedFile,
  onProgress: (pct: number) => void,
): Promise<{ id: string }> {
  const token = tokenStore.get();
  const body = await (await fetch(video.uri)).blob();
  let blobUrl: string;
  try {
    const blob = await upload(videoBlobPathname(userId, video.type), body, {
      access: "public",
      handleUploadUrl: `${API_URL}/api/videos/upload`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      contentType: video.type,
      multipart: false,
      onUploadProgress: (p) => onProgress(Math.round(p.percentage)),
    });
    blobUrl = blob.url;
  } catch (e) {
    throw new Error((e as Error).message || "Network error. Is the server reachable?");
  }
  const { video: created } = await api.createVideo({ ...fields, videoUrl: blobUrl });
  return created;
}
