import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const videoMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().max(5000).default(""),
  thumbnailUrl: z.string().url("Upload a thumbnail"),
});

/** Body of POST /api/videos: metadata plus the URL of the video already uploaded to Vercel Blob. */
export const createVideoSchema = videoMetaSchema.extend({
  videoUrl: z.string({ error: "Upload a video" }).url("Upload a video"),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Comment can't be empty").max(1000),
});

export const avatarSchema = z.object({
  avatarUrl: z.string().url(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VideoMetaInput = z.infer<typeof videoMetaSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export const VIDEO_EXT_BY_MIME: Record<(typeof ALLOWED_VIDEO_TYPES)[number], string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** Blob pathname a user's video upload must use; the server rejects tokens for any other prefix. */
export const videoBlobPrefix = (userId: string) => `videos/${userId}/`;
export const videoBlobPathname = (userId: string, mimeType: string) =>
  `${videoBlobPrefix(userId)}video.${VIDEO_EXT_BY_MIME[mimeType as keyof typeof VIDEO_EXT_BY_MIME] ?? "mp4"}`;
