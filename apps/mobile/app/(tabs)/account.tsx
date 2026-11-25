import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ScrollView, Text, View } from "react-native";
import { IK_UPLOAD_FOLDERS, formatCount } from "@vidora/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { uploadImageToImageKit } from "@/lib/upload";
import { colors } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { Button, ErrorText } from "@/components/ui";
import { IKIcon } from "@/components/IKIcon";
import { SignInPrompt } from "@/components/SignInPrompt";

export default function AccountScreen() {
  const { user, logout, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user) return <SignInPrompt message="Sign in to upload, subscribe, like and comment." />;

  const changeAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (r.canceled) return;
    const a = r.assets[0];
    setBusy(true);
    setErr(null);
    try {
      const url = await uploadImageToImageKit({ uri: a.uri, name: a.fileName ?? "avatar.jpg", type: a.mimeType ?? "image/jpeg" }, IK_UPLOAD_FOLDERS.avatars);
      const res = await api.updateAvatar(url);
      setUser(res.user);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 24, gap: 12 }}>
      <View style={{ alignItems: "center", gap: 6, marginBottom: 16 }}>
        <Avatar src={user.avatarUrl} name={user.name} size={104} />
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "700", marginTop: 8 }}>{user.name}</Text>
        <Text style={{ color: colors.muted }}>{user.email}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{formatCount(user.subscriberCount)} subscribers</Text>
      </View>
      {err && <ErrorText>{err}</ErrorText>}
      <Button title="Change avatar" variant="chip" onPress={changeAvatar} loading={busy} icon={<IKIcon name="image" size={20} />} />
      <Button title="Sign out" variant="chip" onPress={logout} icon={<IKIcon name="logout" size={20} />} />
    </ScrollView>
  );
}
