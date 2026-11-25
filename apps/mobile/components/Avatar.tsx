import { Image } from "expo-image";
import { IK_TR } from "@vidora/shared";
import { iconSrc, imageSrc } from "@/lib/api";
import { colors } from "@/lib/theme";

export function Avatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const uri = src ? imageSrc(src, size > 48 ? IK_TR.avatarLg : IK_TR.avatarSm) : iconSrc("avatar-default");
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={`${name}'s avatar`}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.chip }}
      contentFit="cover"
    />
  );
}
