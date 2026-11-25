/** Folder in ImageKit that holds the app's icon set (seeded by `npm run seed:icons`). */
export const IK_ICON_FOLDER = "/vidora/icons";
export const IK_UPLOAD_FOLDERS = {
  thumbnails: "/vidora/thumbnails",
  avatars: "/vidora/avatars",
} as const;

/**
 * Build an ImageKit URL with optional transformations.
 * `src` may be a full ImageKit URL or a path relative to the URL endpoint.
 */
export function ikUrl(endpoint: string, src: string, transforms?: string): string {
  const base = endpoint.replace(/\/+$/, "");
  const url = /^https?:\/\//.test(src) ? src : `${base}/${src.replace(/^\/+/, "")}`;
  if (!transforms) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tr=${transforms}`;
}

export function ikIcon(endpoint: string, name: string): string {
  return ikUrl(endpoint, `${IK_ICON_FOLDER}/${name}.svg`);
}

export const IK_TR = {
  card: "w-640,h-360,fo-auto",
  poster: "w-1280,h-720,fo-auto",
  avatarSm: "w-72,h-72,fo-face,r-max",
  avatarLg: "w-160,h-160,fo-face,r-max",
} as const;

/** Default avatar served from ImageKit for new users. */
export const DEFAULT_AVATAR_PATH = "/vidora/icons/avatar-default.svg";
