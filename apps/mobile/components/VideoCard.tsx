import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IK_TR, formatViews, timeAgo, type VideoSummary } from "@vidora/shared";
import { imageSrc } from "@/lib/api";
import { colors } from "@/lib/theme";
import { Avatar } from "./Avatar";

export function VideoCard({ video }: { video: VideoSummary }) {
  const router = useRouter();
  return (
    <Link href={{ pathname: "/watch/[id]", params: { id: video.id } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`${video.title} by ${video.owner.name}`} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
        <Image source={{ uri: imageSrc(video.thumbnailUrl, IK_TR.card) }} style={s.thumb} contentFit="cover" transition={200} />
        <View style={s.meta}>
          <Pressable
            onPress={() => router.push({ pathname: "/channel/[id]", params: { id: video.owner.id } })}
            accessibilityRole="link"
            accessibilityLabel={`${video.owner.name} channel`}
            hitSlop={6}
          >
            <Avatar src={video.owner.avatarUrl} name={video.owner.name} size={36} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={s.sub} numberOfLines={1}>
              {video.owner.name} · {formatViews(video.views)} · {timeAgo(video.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 20 },
  thumb: { width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.chip },
  meta: { flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingTop: 12 },
  title: { color: colors.fg, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
