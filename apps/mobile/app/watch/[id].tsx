import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatCount, formatViews, timeAgo, type CommentItem, type VideoDetail } from "@vidora/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { IKIcon } from "@/components/IKIcon";

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getVideo(id)
      .then(({ video }) => {
        setVideo(video);
        navigation.setOptions({ title: video.owner.name });
      })
      .catch((e: Error) => setErr(e.message));
    api.listComments(id).then((r) => setComments(r.items)).catch(() => {});
  }, [id, user?.id, navigation]);

  useEffect(() => {
    api.recordView(id).catch(() => {});
  }, [id]);

  const requireAuth = () => {
    if (user) return true;
    router.push("/login");
    return false;
  };

  if (err) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Video unavailable</Text>
        <Text style={s.muted}>{err}</Text>
      </View>
    );
  }
  if (!video) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Player uri={api.absolute(video.streamUrl)} />
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Header
            video={video}
            requireAuth={requireAuth}
            commentCount={comments.length}
            onComment={(c) => setComments((prev) => [c, ...prev])}
          />
        }
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            onDelete={async () => {
              setComments((prev) => prev.filter((c) => c.id !== item.id));
              await api.deleteComment(item.id).catch(() => setComments((prev) => [item, ...prev]));
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </KeyboardAvoidingView>
  );
}

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

function Header({
  video,
  requireAuth,
  commentCount,
  onComment,
}: {
  video: VideoDetail;
  requireAuth: () => boolean;
  commentCount: number;
  onComment: (c: CommentItem) => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(video.likedByMe);
  const [likes, setLikes] = useState(video.likeCount);
  const [subscribed, setSubscribed] = useState(video.subscribedToOwner);
  const [subs, setSubs] = useState(video.owner.subscriberCount);
  const [showDesc, setShowDesc] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const toggleLike = async () => {
    if (!requireAuth()) return;
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    try {
      const r = await api.toggleLike(video.id);
      setLiked(r.liked);
      setLikes(r.likeCount);
    } catch {
      setLiked(liked);
      setLikes(likes);
    }
  };

  const toggleSub = async () => {
    if (!requireAuth()) return;
    setSubscribed(!subscribed);
    try {
      const r = await api.toggleSubscribe(video.owner.id);
      setSubscribed(r.subscribed);
      setSubs(r.subscriberCount);
    } catch {
      setSubscribed(subscribed);
    }
  };

  const post = async () => {
    if (!requireAuth() || !text.trim()) return;
    setPosting(true);
    try {
      const { comment } = await api.addComment(video.id, text);
      onComment(comment);
      setText("");
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={{ padding: 12, gap: 14 }}>
      <Text style={s.title}>{video.title}</Text>

      <View style={s.row}>
        <Avatar src={video.owner.avatarUrl} name={video.owner.name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={s.channel} numberOfLines={1}>{video.owner.name}</Text>
          <Text style={s.muted}>{formatCount(subs)} subscribers</Text>
        </View>
        {!video.isOwner && (
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
      </View>

      <View style={s.row}>
        <Pressable onPress={toggleLike} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} style={[s.pill, { backgroundColor: colors.chip }]}>
          <IKIcon name={liked ? "liked" : "like"} size={18} />
          <Text style={{ color: colors.fg, fontWeight: "600" }}>{formatCount(likes)}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setShowDesc(!showDesc)} style={s.desc} accessibilityRole="button">
        <Text style={{ color: colors.fg, fontWeight: "600", fontSize: 13 }}>
          {formatViews(video.views)} · {timeAgo(video.createdAt)}
        </Text>
        <Text style={{ color: colors.fg, fontSize: 13, marginTop: 4, lineHeight: 19 }} numberOfLines={showDesc ? undefined : 2}>
          {video.description || "No description."}
        </Text>
      </Pressable>

      <Text style={[s.channel, { fontSize: 17 }]}>Comments · {formatCount(commentCount)}</Text>
      {user ? (
        <View style={s.row}>
          <Avatar src={user.avatarUrl} name={user.name} size={32} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={colors.muted}
            maxLength={1000}
            style={s.commentInput}
            accessibilityLabel="Add a comment"
            onSubmitEditing={post}
            returnKeyType="send"
          />
          <Pressable onPress={post} disabled={posting || !text.trim()} accessibilityLabel="Post comment" style={{ padding: 8, opacity: text.trim() ? 1 : 0.4 }}>
            <IKIcon name="send" size={22} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={requireAuth}>
          <Text style={{ color: colors.link, fontWeight: "600" }}>Sign in to comment</Text>
        </Pressable>
      )}
    </View>
  );
}

function CommentRow({ comment, onDelete }: { comment: CommentItem; onDelete: () => void }) {
  return (
    <View style={[s.row, { paddingHorizontal: 12, paddingVertical: 10, alignItems: "flex-start" }]}>
      <Avatar src={comment.author.avatarUrl} name={comment.author.name} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={s.muted}>
          @{comment.author.name} · {timeAgo(comment.createdAt)}
        </Text>
        <Text style={{ color: colors.fg, fontSize: 14, marginTop: 2, lineHeight: 20 }}>{comment.text}</Text>
      </View>
      {comment.isMine && (
        <Pressable onPress={onDelete} accessibilityLabel="Delete comment" hitSlop={8} style={{ padding: 6 }}>
          <IKIcon name="trash" size={18} tint={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24, backgroundColor: colors.bg },
  title: { color: colors.fg, fontSize: 18, fontWeight: "700", lineHeight: 24 },
  channel: { color: colors.fg, fontSize: 15, fontWeight: "600" },
  muted: { color: colors.muted, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 16, borderRadius: radius.pill },
  desc: { backgroundColor: colors.chip, borderRadius: radius.md, padding: 12 },
  commentInput: { flex: 1, color: colors.fg, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8, fontSize: 14 },
});
