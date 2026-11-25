import { useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SearchResults } from "@vidora/shared";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { ChannelRow } from "@/components/ChannelRow";
import { VideoCard } from "@/components/VideoCard";
import { IKIcon } from "@/components/IKIcon";

type Row = { kind: "header"; title: string } | { kind: "channel"; item: SearchResults["channels"][number] } | { kind: "video"; item: SearchResults["videos"][number] };

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reqId = useRef(0);

  const submit = () => {
    const term = q.trim();
    if (!term) return;
    const mine = ++reqId.current;
    setSubmitted(term);
    setLoading(true);
    setErr(null);
    api
      .search(term)
      .then((r) => mine === reqId.current && setResults(r))
      .catch((e: Error) => mine === reqId.current && setErr(e.message))
      .finally(() => mine === reqId.current && setLoading(false));
  };

  const rows: Row[] = results
    ? [
        ...(results.channels.length ? [{ kind: "header" as const, title: "Channels" }] : []),
        ...results.channels.map((item) => ({ kind: "channel" as const, item })),
        ...(results.videos.length ? [{ kind: "header" as const, title: "Videos" }] : []),
        ...results.videos.map((item) => ({ kind: "video" as const, item })),
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.bar}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submit}
          placeholder="Search channels and videos"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          accessibilityLabel="Search channels and videos"
          style={s.input}
        />
        <Pressable onPress={submit} accessibilityRole="button" accessibilityLabel="Search" style={s.btn}>
          <IKIcon name="search" size={20} />
        </Pressable>
      </View>

      {loading && !results ? (
        <ActivityIndicator color={colors.fg} style={{ marginTop: 40 }} />
      ) : err ? (
        <Text style={s.empty}>{err}</Text>
      ) : results && rows.length === 0 ? (
        <Text style={s.empty}>No results for “{submitted}”.</Text>
      ) : !results ? (
        <Text style={s.empty}>Find channels and videos by name.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => (r.kind === "header" ? `h-${r.title}` : `${r.kind}-${r.item.id}-${i}`)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: r }) =>
            r.kind === "header" ? (
              <Text style={s.section}>{r.title}</Text>
            ) : r.kind === "channel" ? (
              <ChannelRow channel={r.item} />
            ) : (
              <VideoCard video={r.item} />
            )
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", margin: 12 },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.pill,
    borderBottomLeftRadius: radius.pill,
    paddingHorizontal: 16,
    color: colors.fg,
    fontSize: 15,
  },
  btn: {
    width: 56,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
  },
  section: { color: colors.muted, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
