import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function ListHeader({
    visible = true,
    title = "Name",
    sortDir = "asc", // "asc" | "desc"
    onToggleSort,
    view = "list", // "list" | "grid"
    onToggleView,
})  {
    const { theme } = useTheme();
    const c = useMemo(() => getThemeColors(theme), [theme]);
    const styles = useMemo(() => makeStyles(c), [c]);

    if (!visible) return null;

    const sortArrowIcon = sortDir === "asc" ? "arrow-up" : "arrow-down";
    const toggleIcon = view === "list" ? "view-grid-outline" : "view-list-outline";

    return (
        <View style={styles.header}>
            <View style={styles.leftHeader}>
                <Text style={styles.title}>{title}</Text>

                <Pressable
                onPress={onToggleSort}
                style={({ pressed }) => [styles.sortCircleBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Toggle name sort direction"
                hitSlop={8}
                >
                <MaterialCommunityIcons name={sortArrowIcon} size={16} color={c.icon} />
            </Pressable>
        </View>

        <Pressable
            onPress={onToggleView}
            style={styles.toggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Toggle view"
        >
            <MaterialCommunityIcons name={toggleIcon} size={22} color={c.icon} />
        </Pressable>
    </View>
    );
}

function makeStyles(c) {
    return StyleSheet.create({
        header: {
            height: 46,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        leftHeader: { flexDirection: "row", alignItems: "center" },
        title: { fontSize: 15, fontWeight: "600", color: c.text },

        sortCircleBtn: {
            marginLeft: 8,
            width: 28,
            height: 28,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: c.borderSoft,
            backgroundColor: c.surface,
            alignItems: "center",
            justifyContent: "center",
        },
        pressed: { opacity: 0.85 },

        toggleBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
        },
    });
}
