"use client";

import { upload } from "@imagekit/next";
import { api } from "./client";

/** Uploads an image straight from the browser to ImageKit using server-signed params. */
export async function uploadImageToImageKit(file: File, folder: string, onProgress?: (pct: number) => void) {
  const auth = await api.imagekitAuth();
  const res = await upload({
    file,
    fileName: file.name,
    folder,
    token: auth.token,
    signature: auth.signature,
    expire: auth.expire,
    publicKey: auth.publicKey,
    useUniqueFileName: true,
    onProgress: (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  if (!res.url) throw new Error("ImageKit did not return a URL");
  return res.url;
}
