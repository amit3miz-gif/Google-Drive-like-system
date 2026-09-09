import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/authContext";
import { enableScreens } from "react-native-screens";
import { ThemeProvider } from "../src/context/ThemeContext";import { SafeAreaProvider } from "react-native-safe-area-context";

enableScreens(true);// improves navigation performance

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
    
              <Stack.Screen name="(tabs)" />

              {/* screens outside tabs - (stack) */}
              <Stack.Screen
                name="(stack)"
                options={{
                  headerShown: false, // the group navigator controls its own headers
                }}
              />
            </Stack>
          </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
