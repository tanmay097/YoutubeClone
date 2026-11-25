import { IK_TR } from "@vidora/shared";
import { iconSrc, imageSrc } from "@/lib/client";
import { FallbackImg } from "./FallbackImg";

/** User avatar from ImageKit, falling back to the ImageKit default avatar, then the bundled one. */
export function Avatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const sources = [
    ...(src ? [imageSrc(src, size > 48 ? IK_TR.avatarLg : IK_TR.avatarSm)] : []),
    iconSrc("avatar-default"),
    "/icons/avatar-default.svg",
  ];
  return (
    <FallbackImg
      sources={sources}
      alt={`${name}'s avatar`}
      width={size}
      height={size}
      className="shrink-0 overflow-hidden rounded-full bg-chip object-cover text-[0px]"
      style={{ width: size, height: size }}
    />
  );
}
