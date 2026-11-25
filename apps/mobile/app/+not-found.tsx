import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.fg, fontSize: 20, fontWeight: "700" }}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={{ color: colors.link }}>Go to home</Link>
      </View>
    </>
  );
}
