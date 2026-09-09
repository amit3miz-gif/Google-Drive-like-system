// Menu profiles for different contexts

// Full menu for regular pages
export function getFullMenuActions({ isStarred }) {
  return [
    { key: "rename", label: "Rename", icon: "edit" },
    { key: "move", label: "Move", icon: "drive-file-move" },
    { key: "download", label: "Download", icon: "download" },
    { key: "details", label: "Details", icon: "info-outline" },
    { key: "star", label: isStarred ? "Unstar" : "Star", icon: isStarred ? "star" : "star-outline" },
    { key: "share", label: "Share", icon: "share" },
    { key: "delete", label: "Delete", icon: "delete", variant: "danger" },
  ];
}

// Menu for Trash page
export function getTrashMenuActions() {
  return [
    { key: "restore", label: "Restore", icon: "restore" },
    { key: "delete_forever", label: "Delete forever", icon: "delete-forever", variant: "danger" },
  ];
}