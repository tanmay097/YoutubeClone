import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { Button } from "./ui";
import { IKIcon } from "./IKIcon";

export function SignInPrompt({ message }: { message: string }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12, backgroundColor: colors.bg }}>
      <IKIcon name="user" size={48} />
      <Text style={{ color: colors.fg, fontSize: 20, fontWeight: "700" }}>You&apos;re not signed in</Text>
      <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 8 }}>{message}</Text>
      <Button title="Sign in" variant="light" onPress={() => router.push("/login")} />
    </View>
  );
}
