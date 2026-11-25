import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { VideoSummary } from "@vidora/shared";
import { api, iconSrc } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { colors } from "@/lib/theme";
import { VideoCard } from "@/components/VideoCard";

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api
        .listVideos()
        .then((r) => {
          setErr(null);
          setVideos(r.items);
          setCursor(r.nextCursor);
        })
        .catch((e: Error) => {
          setErr(e.message);
          setVideos((v) => v ?? []);
        }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const more = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await api.listVideos(cursor);
      setVideos((v) => [...(v ?? []), ...r.items]);
      setCursor(r.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  if (videos === null) {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.fg} />}
      contentContainerStyle={videos.length === 0 ? { flexGrow: 1 } : { paddingTop: 4 }}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.fg} style={{ margin: 20 }} /> : undefined}
      ListEmptyComponent={
        <View style={s.center}>
          <Image source={{ uri: iconSrc("empty-videos") }} style={{ width: 240, height: 160 }} />
          <Text style={s.emptyTitle}>{err ? "Can't reach the server" : "No videos yet"}</Text>
          <Text style={s.emptyBody}>{err ? `Make sure the server is running at ${API_URL}` : "Upload the first one from the Upload tab."}</Text>
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  emptyTitle: { color: colors.fg, fontSize: 20, fontWeight: "700", marginTop: 20 },
  emptyBody: { color: colors.muted, fontSize: 14, marginTop: 6, textAlign: "center" },
});
