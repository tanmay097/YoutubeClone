import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { IKIcon } from "@/components/IKIcon";
import { colors } from "@/lib/theme";

const icon = (name: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <IKIcon name={name} size={24} tint={focused ? colors.fg : colors.muted} />;
  };

function Brand() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <IKIcon name="logo" size={26} />
      <Text style={{ color: colors.fg, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>Vidora</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.fg,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.fg,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerTitle: () => <Brand />, headerTitleAlign: "left", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search") }} />
      <Tabs.Screen name="upload" options={{ title: "Upload", tabBarIcon: icon("upload") }} />
      <Tabs.Screen name="account" options={{ title: "You", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
