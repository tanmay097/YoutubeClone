export interface PublicUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  subscriberCount: number;
}

export interface VideoSummary {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  owner: PublicUser;
}

export interface VideoDetail extends VideoSummary {
  description: string;
  streamUrl: string;
  likedByMe: boolean;
  subscribedToOwner: boolean;
  isOwner: boolean;
}

export interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  author: PublicUser;
  isMine: boolean;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface ChannelSummary extends PublicUser {
  videoCount: number;
}

export interface ChannelDetail extends ChannelSummary {
  subscribedByMe: boolean;
  isMe: boolean;
}

export interface SearchResults {
  channels: ChannelSummary[];
  videos: VideoSummary[];
}
