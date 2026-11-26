import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ALLOWED_VIDEO_TYPES, IK_UPLOAD_FOLDERS, MAX_VIDEO_BYTES, videoMetaSchema } from "@vidora/shared";
import { useAuth } from "@/lib/auth";
import { uploadImageToImageKit, uploadVideo, type PickedFile } from "@/lib/upload";
import { colors, radius } from "@/lib/theme";
import { Button, ErrorText, Field } from "@/components/ui";
import { IKIcon } from "@/components/IKIcon";
import { SignInPrompt } from "@/components/SignInPrompt";

const extFromMime: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

export default function UploadScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [video, setVideo] = useState<PickedFile | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!user) return <SignInPrompt message="Sign in to upload videos to your channel." />;

  const pickVideo = async () => {
    setErr(null);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1 });
    if (r.canceled) return;
    const a = r.assets[0];
    const type = a.mimeType ?? "video/mp4";
    if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(type)) return setErr("Only MP4, WebM or MOV videos are supported.");
    if (a.fileSize && a.fileSize > MAX_VIDEO_BYTES) return setErr("Video must be under 500 MB.");
    const name = a.fileName ?? `video.${extFromMime[type] ?? "mp4"}`;
    setVideo({ uri: a.uri, name, type });
    if (!title) setTitle(name.replace(/\.[^.]+$/, "").slice(0, 100));
  };

  const pickThumb = async () => {
    setErr(null);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.9 });
    if (r.canceled) return;
    const a = r.assets[0];
    setThumbBusy(true);
    try {
      const url = await uploadImageToImageKit(
        { uri: a.uri, name: a.fileName ?? "thumbnail.jpg", type: a.mimeType ?? "image/jpeg" },
        IK_UPLOAD_FOLDERS.thumbnails,
      );
      setThumbUrl(url);
    } catch (e) {
      setErr(`Thumbnail upload failed: ${(e as Error).message}`);
    } finally {
      setThumbBusy(false);
    }
  };

  const publish = async () => {
    setErr(null);
    if (!video) return setErr("Choose a video to upload.");
    const meta = videoMetaSchema.safeParse({ title, description, thumbnailUrl: thumbUrl ?? "" });
    if (!meta.success) return setErr(meta.error.issues[0].message);
    setPct(0);
    try {
      const { id } = await uploadVideo(user.id, meta.data, video, setPct);
      setVideo(null);
      setThumbUrl(null);
      setTitle("");
      setDescription("");
      router.push({ pathname: "/watch/[id]", params: { id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPct(null);
    }
  };

  const uploading = pct !== null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickVideo} disabled={uploading} style={s.drop} accessibilityRole="button" accessibilityLabel="Choose video">
          <View style={s.circle}>
            <IKIcon name={video ? "check" : "video"} size={30} />
          </View>
          <Text style={s.dropTitle} numberOfLines={1}>{video ? video.name : "Choose a video"}</Text>
          <Text style={s.muted}>{video ? "Tap to change" : "MP4, WebM or MOV · up to 500 MB"}</Text>
        </Pressable>

        <View style={{ gap: 6 }}>
          <Text style={s.label}>Thumbnail (stored on ImageKit)</Text>
          <Pressable onPress={pickThumb} disabled={thumbBusy || uploading} style={s.thumb} accessibilityRole="button" accessibilityLabel="Choose thumbnail">
            {thumbUrl ? (
              <Image source={{ uri: thumbUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <>
                <IKIcon name="image" size={28} tint={colors.muted} />
                <Text style={s.muted}>{thumbBusy ? "Uploading…" : "Add a 16:9 thumbnail"}</Text>
              </>
            )}
          </Pressable>
        </View>

        <Field label="Title" value={title} onChangeText={setTitle} maxLength={100} placeholder="Add a title" />
        <Field label="Description" value={description} onChangeText={setDescription} maxLength={5000} multiline placeholder="Tell viewers about your video" />

        {err && <ErrorText>{err}</ErrorText>}
        {uploading && (
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            <Text style={s.muted}>Uploading video… {pct}%</Text>
            <View style={s.track}>
              <View style={[s.bar, { width: `${pct}%` }]} />
            </View>
          </View>
        )}
        <Button title={uploading ? "Uploading…" : "Publish"} onPress={publish} disabled={uploading || thumbBusy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  drop: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  circle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.chip, alignItems: "center", justifyContent: "center" },
  dropTitle: { color: colors.fg, fontSize: 16, fontWeight: "600" },
  thumb: {
    aspectRatio: 16 / 9,
    width: "60%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  label: { color: colors.fg, fontSize: 14, fontWeight: "500" },
  muted: { color: colors.muted, fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.chip, overflow: "hidden" },
  bar: { height: "100%", backgroundColor: colors.primary },
});
