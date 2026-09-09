import { Stack } from "expo-router";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";

import StackTopBar from "../../src/components/layout/StackTopBar";
import StackTopBarWithSearch from "../../src/components/layout/StackTopBarWithSearch";

function formatTitle(name = "") {
  if (!name) return "";
  return String(name)
    .replace(/\[.*?\]/g, "")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StackLayout() {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: ({ options, route }) => {
          const title = options?.title ?? formatTitle(route?.name || "");
          return <StackTopBarWithSearch title={title} />;
        },

        // keep stack screens above the bottom safe-area
        contentStyle: { backgroundColor: c.pageBg, paddingBottom: insets.bottom },
      }}
    >
      <Stack.Screen name="recent" options={{ title: "Recent" }} />
      <Stack.Screen name="trash" options={{ title: "Trash" }} />

      <Stack.Screen
        name="uploads"
        options={{ header: () => <StackTopBar title="Uploads" /> }}
      />

      <Stack.Screen
        name="createText"
        options={{ header: () => <StackTopBar title="New text file" /> }}
      />

      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "fade_from_bottom",
        }}
      />

      <Stack.Screen
        name="move"
        options={{
          headerShown: true,
          title: "Select destination",
          headerTitleAlign: "center",
          headerBackTitle: "Back",
          headerBackTitleVisible: true,
          contentStyle: { backgroundColor: c.pageBg, paddingBottom: 0 },
        }}
      />

      <Stack.Screen
        name="details/[id]"
        options={{ header: () => <StackTopBar title="Details" /> }}
      />

      <Stack.Screen
        name="share/[id]"
        options={{
          header: () => <StackTopBar title="Share" />,
          contentStyle: { backgroundColor: c.surface, paddingBottom: 0 },
        }}
      />

      <Stack.Screen
        name="file/[id]"
        options={{ header: () => <StackTopBar title="" /> }}
      />
    </Stack>
  );
}
