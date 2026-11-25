import Link from "next/link";
import { formatCount, type ChannelSummary } from "@vidora/shared";
import { Avatar } from "./Avatar";

/** Search-result row for a channel, linking to its channel page. */
export function ChannelRow({ channel }: { channel: ChannelSummary }) {
  return (
    <Link
      href={`/channel/${channel.id}`}
      className="flex items-center gap-4 rounded-xl p-3 transition-colors duration-150 hover:bg-chip sm:gap-8"
    >
      <div className="flex w-16 justify-center sm:w-[136px]">
        <Avatar src={channel.avatarUrl} name={channel.name} size={64} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{channel.name}</p>
        <p className="text-sm text-muted">
          {formatCount(channel.subscriberCount)} subscribers · {channel.videoCount} {channel.videoCount === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}
