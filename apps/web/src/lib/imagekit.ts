import { getUploadAuthParams } from "@imagekit/next/server";

// Read NEXT_PUBLIC_* dynamically on the server so values come from the runtime env, not build-time inlining.
const env = (k: string) => process.env[k];

export function imagekitConfig() {
  const urlEndpoint = env("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT");
  const publicKey = env("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY");
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error("ImageKit env vars are missing. See apps/web/.env.example.");
  }
  return { urlEndpoint, publicKey, privateKey };
}

export function createUploadAuth() {
  const { urlEndpoint, publicKey, privateKey } = imagekitConfig();
  return { ...getUploadAuthParams({ publicKey, privateKey }), publicKey, urlEndpoint };
}

/** Only accept image URLs that point at our own ImageKit endpoint. */
export function isImageKitUrl(url: string) {
  const endpoint = env("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT")?.replace(/\/+$/, "");
  return !!endpoint && (url === endpoint || url.startsWith(`${endpoint}/`));
}
