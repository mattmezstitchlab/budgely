import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { UI } from "@/components/budgely-ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: UI.lime,
        tabBarInactiveTintColor: UI.subtle,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: UI.bg, borderTopColor: UI.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "Mouvements", tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="budgets" options={{ title: "Budgets", tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
