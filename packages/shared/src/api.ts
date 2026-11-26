import type {
  AuthResponse,
  ChannelDetail,
  CommentItem,
  ImageKitAuthParams,
  Paginated,
  PublicUser,
  SearchResults,
  VideoDetail,
  VideoSummary,
} from "./types";
import type { CreateVideoInput, LoginInput, RegisterInput } from "./schemas";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ApiClientOptions {
  /** Base URL of the Next.js server, e.g. http://192.168.1.10:3000. Empty string = same origin. */
  baseUrl: string;
  /** Returns a bearer token (mobile). Web relies on the httpOnly cookie instead. */
  getToken?: () => string | null | Promise<string | null>;
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  const root = baseUrl.replace(/\/+$/, "");

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = getToken ? await getToken() : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${root}${path}`, { ...init, headers, credentials: "include" });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || res.statusText);
    return data as T;
  }

  const json = (body: unknown) => JSON.stringify(body);

  return {
    baseUrl: root,
    request,
    register: (input: RegisterInput) =>
      request<AuthResponse>("/api/auth/register", { method: "POST", body: json(input) }),
    login: (input: LoginInput) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: json(input) }),
    logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
    me: () => request<{ user: PublicUser | null }>("/api/auth/me"),
    updateAvatar: (avatarUrl: string) =>
      request<{ user: PublicUser }>("/api/auth/me", { method: "PATCH", body: json({ avatarUrl }) }),
    imagekitAuth: () => request<ImageKitAuthParams>("/api/imagekit-auth"),
    listVideos: (cursor?: string) =>
      request<Paginated<VideoSummary>>(`/api/videos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
    createVideo: (input: CreateVideoInput) =>
      request<{ video: VideoSummary }>("/api/videos", { method: "POST", body: json(input) }),
    getVideo: (id: string) => request<{ video: VideoDetail }>(`/api/videos/${id}`),
    recordView: (id: string) => request<{ views: number }>(`/api/videos/${id}/view`, { method: "POST" }),
    /** Absolute URL for a server-relative path such as a video's streamUrl. */
    absolute: (path: string) => (/^https?:\/\//.test(path) ? path : `${root}${path}`),
    toggleLike: (id: string) =>
      request<{ liked: boolean; likeCount: number }>(`/api/videos/${id}/like`, { method: "POST" }),
    search: (q: string) => request<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`),
    getChannel: (id: string, cursor?: string) =>
      request<{ channel: ChannelDetail; videos: Paginated<VideoSummary> }>(
        `/api/channels/${id}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    toggleSubscribe: (channelId: string) =>
      request<{ subscribed: boolean; subscriberCount: number }>(`/api/channels/${channelId}/subscribe`, {
        method: "POST",
      }),
    listComments: (videoId: string) => request<{ items: CommentItem[] }>(`/api/videos/${videoId}/comments`),
    addComment: (videoId: string, text: string) =>
      request<{ comment: CommentItem }>(`/api/videos/${videoId}/comments`, { method: "POST", body: json({ text }) }),
    deleteComment: (commentId: string) => request<{ ok: true }>(`/api/comments/${commentId}`, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
