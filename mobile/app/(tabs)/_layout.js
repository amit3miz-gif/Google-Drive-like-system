import { Tabs, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TopBar from "../../src/components/layout/TopBar";
import SideMenu from "../../src/components/layout/SideMenu";

import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";

export default function TabsLayout() {
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(2, insets.bottom + 2);

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);

  return (
    <>
      <Tabs
        initialRouteName="drive/index"
        screenOptions={{
          headerShown: true,
          header: () => (
            <TopBar
              value={q}
              onSearchPress={() => {
                router.push({
                  pathname: "/(stack)/search",
                  params: { q },
                });
              }}
              onMenuPress={() => setMenuOpen(true)}
              onAvatarPress={() => {}}
            />
          ),

          // Tab bar theming + safe-area bottom
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: { fontSize: 12 },

          tabBarStyle: {
            height: 54 + tabBarBottom,
            paddingBottom: tabBarBottom,
            paddingTop: 2,
            borderTopWidth: 1,
            borderTopColor: c.borderSoft,
            backgroundColor: c.surface,
          },
        }}
      >
        <Tabs.Screen
          name="drive/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "folder" : "folder-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shared-with-me"
          options={{
            title: "Shared",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "account-multiple" : "account-multiple-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="starred"
          options={{
            title: "Starred",
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "star" : "star-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onGoRecent={() => {
          setMenuOpen(false);
          router.push("/(stack)/recent");
        }}
        onGoTrash={() => {
          setMenuOpen(false);
          router.push("/(stack)/trash");
        }}
      />
    </>
  );
}