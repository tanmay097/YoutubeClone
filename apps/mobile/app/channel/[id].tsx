import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { formatCount, type ChannelDetail, type VideoSummary } from "@vidora/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { IKIcon } from "@/components/IKIcon";
import { VideoCard } from "@/components/VideoCard";

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subs, setSubs] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getChannel(id)
      .then((r) => {
        setChannel(r.channel);
        setSubscribed(r.channel.subscribedByMe);
        setSubs(r.channel.subscriberCount);
        setVideos(r.videos.items);
        setCursor(r.videos.nextCursor);
        navigation.setOptions({ title: r.channel.name });
      })
      .catch((e: Error) => setErr(e.message));
  }, [id, user?.id, navigation]);

  const more = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await api.getChannel(id, cursor);
      setVideos((v) => [...v, ...r.videos.items]);
      setCursor(r.videos.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [id, cursor, loadingMore]);

  const toggleSub = async () => {
    if (!user) return router.push("/login");
    setSubscribed(!subscribed);
    try {
      const r = await api.toggleSubscribe(id);
      setSubscribed(r.subscribed);
      setSubs(r.subscriberCount);
    } catch {
      setSubscribed(subscribed);
    }
  };

  if (err) {
    return (
      <View style={s.center}>
        <Text style={s.name}>Channel unavailable</Text>
        <Text style={s.muted}>{err}</Text>
      </View>
    );
  }
  if (!channel) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(v) => v.id}
      renderItem={({ item }) => <VideoCard video={item} />}
      onEndReached={more}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={s.header}>
          <Avatar src={channel.avatarUrl} name={channel.name} size={88} />
          <Text style={s.name}>{channel.name}</Text>
          <Text style={s.muted}>
            {formatCount(subs)} subscribers · {channel.videoCount} {channel.videoCount === 1 ? "video" : "videos"}
          </Text>
          {!channel.isMe && (
            <Pressable
              onPress={toggleSub}
              accessibilityRole="button"
              accessibilityState={{ selected: subscribed }}
              style={[s.pill, { backgroundColor: subscribed ? colors.chip : colors.fg }]}
            >
              {subscribed && <IKIcon name="bell" size={16} />}
              <Text style={{ color: subscribed ? colors.fg : colors.bg, fontWeight: "600" }}>{subscribed ? "Subscribed" : "Subscribe"}</Text>
            </Pressable>
          )}
          <Text style={s.section}>Videos</Text>
        </View>
      }
      ListEmptyComponent={<Text style={[s.muted, { textAlign: "center", marginTop: 24 }]}>No videos yet.</Text>}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.fg} style={{ margin: 20 }} /> : undefined}
      style={{ backgroundColor: colors.bg }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24, backgroundColor: colors.bg },
  header: { alignItems: "center", gap: 6, paddingTop: 20, paddingBottom: 8 },
  name: { color: colors.fg, fontSize: 22, fontWeight: "800", marginTop: 8 },
  muted: { color: colors.muted, fontSize: 13 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, height: 36, borderRadius: radius.pill, marginTop: 10 },
  section: { alignSelf: "stretch", color: colors.fg, fontSize: 17, fontWeight: "700", paddingHorizontal: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
});
