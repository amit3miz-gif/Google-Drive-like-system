export const Themes = {
  light: {
    colors: {
      primary: "#1976d2",
      onPrimary: "#ffffff",
      chromeBg: "#e8f0fe",
      pageBg: "#f2f2f2",
      surface: "#ffffff",
      surface2: "#f2f2f2",
      surfaceHover: "#f7faff",
      text: "#1f2937",
      muted: "#6b7280",

      border: "#eef0f6",
      borderSoft: "rgba(0,0,0,0.12)",
      borderSoft2: "rgba(0,0,0,0.08)",

      danger: "#c62828",
      dangerBg: "rgba(198, 40, 40, 0.08)",
      dangerBorder: "rgba(198, 40, 40, 0.25)",

      overlay: "rgba(15,18,28,0.45)",

      spinnerTrack: "#ddd",
      spinnerHead: "#3498db",

      icon: "#5f6368",
      warning: "#fbbc04",
      success: "#1e8e3e",

      searchBg: "#f1f3f4",
      searchBgFocus: "#f1f3f4",
    },

    radius: { lg: 16, md: 14, sm: 10 },
    spacing: { xs: 6, sm: 10, md: 16, lg: 24 },
    font: { sm: 13, md: 15, lg: 24 },

    shadow: {
      card: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
    },
  },

  dark: {
    colors: {
      primary: "#3b82f6",
      onPrimary: "#ffffff",
      chromeBg: "#0b1220",

      // backgrounds
      pageBg: "#0f172a",
      surface: "#111c33",
      surface2: "#0f1a30",
      surfaceHover: "#152244",

      // text
      text: "#ffffff",
      muted: "#cbd5e1",

      // borders
      border: "rgba(255,255,255,0.08)",
      borderSoft: "rgba(255,255,255,0.12)",
      borderSoft2: "rgba(255,255,255,0.08)",

      // overlay (modals only)
      overlay: "rgba(0,0,0,0.55)",

      // status
      warning: "#fbbc04",
      danger: "#ef4444",
      dangerBg: "rgba(239, 68, 68, 0.12)",
      dangerBorder: "rgba(239, 68, 68, 0.28)",
      success: "#22c55e",

      // spinner
      spinnerTrack: "rgba(255,255,255,0.14)",
      spinnerHead: "rgba(59,130,246,0.95)",

      // icons
      icon: "#e5e7eb",

      // search
      searchBg: "#0b1220",
      searchBgFocus: "#0b1220",
    },

    radius: { lg: 16, md: 14, sm: 10 },
    spacing: { xs: 6, sm: 10, md: 16, lg: 24 },
    font: { sm: 13, md: 15, lg: 24 },

    shadow: {
      card: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      },
    },
  },
};

export function getTheme(mode = "light") {
  return mode === "dark" ? Themes.dark : Themes.light;
}

// what components expect
export function getThemeColors(mode = "light") {
  return getTheme(mode).colors;
}
