import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export const ThemeContext = createContext(null);

const STORAGE_KEY = "drive_theme_mobile";

// Same idea as web: only "light" / "dark"
function normalizeTheme(v) {
  return v === "dark" || v === "light" ? v : null;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  // init (load from storage, fallback to system)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const saved = normalizeTheme(await AsyncStorage.getItem(STORAGE_KEY));

        if (cancelled) return;

        if (saved) {
          setTheme(saved);
        } else {
          const sys = Appearance.getColorScheme(); // 'light' | 'dark' | null
          setTheme(sys === "dark" ? "dark" : "light");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, theme).catch(() => {});
  }, [theme, ready]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const setThemeSafe = useCallback((t) => {
    const n = normalizeTheme(t);
    if (n) setTheme(n);
  }, []);

  const value = useMemo(
    () => ({ theme, ready, toggleTheme, setTheme: setThemeSafe }),
    [theme, ready, toggleTheme, setThemeSafe]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
