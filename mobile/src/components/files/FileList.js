import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

import FileListItem from "./FileListItem";

const SPACER_ID = "__grid_spacer__";

const GRID_PADDING_X = 12;
const GRID_GAP_X = 12;
const GRID_GAP_Y = 12;

export default function FileList({
  items = [],
  view = "list",
  onItemPress,
  onScroll,
  scrollEventThrottle,
  showStar = false,
  menuEnabled = true,
  getActions = null,
  onMenuAction = null,
  listProps = {},
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);

  const isGrid = view === "grid";
  const { width } = useWindowDimensions();

  const gridItemWidth = Math.floor((width - GRID_PADDING_X * 2 - GRID_GAP_X) / 2);

  const data =
    isGrid && items.length % 2 === 1 ? [...items, { id: SPACER_ID, type: "spacer" }] : items;

  // allow screens to pass contentContainerStyle safely
  const { contentContainerStyle: ccFromProps, ...restListProps } = listProps;

  const baseContent = isGrid ? styles.gridContainer : styles.listContainer;

  // defaults that prevent overlap with top overlays / floating buttons
  const defaultPaddingFixes = {
    paddingTop: 8,
    paddingBottom: 20,
    paddingRight: isGrid ? 46 : 8,
    backgroundColor: c.pageBg,
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(it) => String(it.id)}
      key={isGrid ? "grid" : "list"}
      numColumns={isGrid ? 2 : 1}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item, index }) => {
        if (isGrid && item.id === SPACER_ID) {
          return (
            <View
              style={[
                styles.gridSpacer,
                { width: gridItemWidth, marginTop: GRID_GAP_Y },
                index % 2 === 0 ? styles.gridItemRightGap : null,
              ]}
              pointerEvents="none"
            />
          );
        }

        const starred = !!item?.starred;

        return (
          <FileListItem
            item={item}
            view={view}
            onPress={onItemPress}
            gridItemStyle={
              isGrid
                ? [
                    { width: gridItemWidth, marginTop: GRID_GAP_Y },
                    index % 2 === 0 ? styles.gridItemRightGap : null,
                  ]
                : null
            }
            showStar={showStar}
            isStarred={starred}
            menuEnabled={menuEnabled}
            getActions={getActions}
            onMenuAction={onMenuAction}
          />
        );
      }}
      contentContainerStyle={[baseContent, defaultPaddingFixes, ccFromProps]}
      columnWrapperStyle={isGrid ? styles.gridRow : null}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      {...restListProps}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 8,
  },

  gridContainer: {
    paddingHorizontal: GRID_PADDING_X,
  },

  gridRow: {
    justifyContent: "flex-start",
  },

  gridItemRightGap: {
    marginRight: GRID_GAP_X,
  },

  gridSpacer: {},
});
