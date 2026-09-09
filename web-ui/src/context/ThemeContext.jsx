import { createContext, useEffect, useMemo, useState } from "react";

// Theme context for light/dark mode
export const ThemeContext = createContext(null);

const STORAGE_KEY = "drive_theme";

export function ThemeProvider({ children }) {
  // Default is "light"
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  // Persist only (do NOT apply to <html> so auth pages are not affected)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Toggle function
  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
