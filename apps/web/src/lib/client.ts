import { createApiClient, ikIcon, ikUrl } from "@vidora/shared";

export const api = createApiClient({ baseUrl: "" });

const IK_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";

/** ImageKit-hosted icon; falls back to the local copy in /public/icons until ImageKit is configured. */
export const iconSrc = (name: string) => (IK_ENDPOINT ? ikIcon(IK_ENDPOINT, name) : `/icons/${name}.svg`);

export const imageSrc = (src: string, tr?: string) => (IK_ENDPOINT && src ? ikUrl(IK_ENDPOINT, src, tr) : src);
