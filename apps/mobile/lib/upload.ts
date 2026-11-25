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

/** Streams the video to our API with progress (XHR exposes upload progress in React Native). */
export function uploadVideo(
  fields: { title: string; description: string; thumbnailUrl: string },
  video: PickedFile,
  onProgress: (pct: number) => void,
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("title", fields.title);
    form.append("description", fields.description);
    form.append("thumbnailUrl", fields.thumbnailUrl);
    form.append("video", rnFile(video));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/videos`);
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { error?: string; video?: { id: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.video) resolve(body.video);
      else reject(new Error(body.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error. Is the server reachable?"));
    xhr.send(form);
  });
}
