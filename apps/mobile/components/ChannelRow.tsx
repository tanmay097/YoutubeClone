import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatCount, type ChannelSummary } from "@vidora/shared";
import { colors } from "@/lib/theme";
import { Avatar } from "./Avatar";

export function ChannelRow({ channel }: { channel: ChannelSummary }) {
  return (
    <Link href={{ pathname: "/channel/[id]", params: { id: channel.id } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`${channel.name} channel`} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.chip }]}>
        <Avatar src={channel.avatarUrl} name={channel.name} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{channel.name}</Text>
          <Text style={s.sub}>
            {formatCount(channel.subscriberCount)} subscribers · {channel.videoCount} {channel.videoCount === 1 ? "video" : "videos"}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingVertical: 10 },
  name: { color: colors.fg, fontSize: 16, fontWeight: "600" },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
