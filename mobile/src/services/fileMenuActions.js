import { router } from "expo-router";
import { fileService } from "./fileService";
import {
  splitNameAndExtension,
  hasAllowedExtension,
  allowedExtensionsMessage,
} from "../utils/fileNameUtils";

/**
 * Dispatcher for file menu actions.
 *
 * Usage:
 * handleFileMenuAction({ actionKey, item, screen, token, payload })
 *
 * Params:
 * - actionKey: string (e.g. "rename", "delete", "star", ...).
 * - item: the file/folder item (expects `id`, and optionally `starred` from server).
 * - screen: "drive" | "recent" | "shared" | "starred" | "trash" | "folder"
 * - token: auth token
 * - payload: optional action-specific data (e.g. { name })
 */
export async function handleFileMenuAction({
  actionKey,
  item,
  screen = "drive",
  token = null,
  payload = null,
} = {}) {
  const id = item?.id ? String(item.id) : null;
  const name = item?.name ?? "Item";

  if (!actionKey) return { ok: false, error: "Missing actionKey" };
  if (!item || !id) return { ok: false, error: "Missing item id" };

  const isStarred = !!item?.starred;

  switch (screen) {
    case "trash": {
      switch (actionKey) {
        case "restore": {
          try {
            await fileService.restoreFromTrash(id, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to restore item" };
          }
        }

        case "delete_forever": {
          try {
            await fileService.permanentlyDelete(id, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to delete item permanently" };
          }
        }

        default:
          return { ok: false, error: "Action not implemented" };
      }
    }

    default: {
      switch (actionKey) {
        case "rename": {
          const raw = String(payload?.name ?? "").trim();
          if (!raw) return { ok: false, error: "Name cannot be empty" };

          const isFolder = item?.type === "folder";

          // Folders: no extension constraints
          if (isFolder) {
            try {
              await fileService.update(id, { name: raw }, token);
              return { ok: true };
            } catch (err) {
              return { ok: false, error: err?.message || "Failed to rename item" };
            }
          }

          // Files: enforce allowed extensions
          const currentName = String(item?.name || "");
          const { ext: curExt } = splitNameAndExtension(currentName);
          const curExtLower = curExt.toLowerCase();

          const { ext: newExt } = splitNameAndExtension(raw);
          const newExtLower = newExt.toLowerCase();

          let finalName = raw;

          // If user did not provide an extension, keep the original one (if any)
          if (!newExtLower && curExtLower) {
            finalName = `${raw}${curExtLower}`;
          }

          // prevent changing extension if original had one
          if (curExtLower && newExtLower && curExtLower !== newExtLower) {
            return { ok: false, error: "Changing file extension is not allowed." };
          }

          // If there was no original extension, only allow known extensions when user adds one
          if (!curExtLower && newExtLower && !hasAllowedExtension(finalName)) {
            return { ok: false, error: allowedExtensionsMessage() };
          }

          try {
            await fileService.update(id, { name: finalName }, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to rename item" };
          }
        }

        case "delete": {
          try {
            await fileService.moveToTrash(id, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to move item to trash" };
          }
        }

        case "move": {
          // Navigate to the Move screen (single-item MVP)
          const sourceParentId =
            item?.parentId === null || item?.parentId === undefined
              ? null
              : String(item.parentId);

          router.push({
            pathname: "/(stack)/move",
            params: {
              itemId: id,
              itemName: String(name),
              itemType: String(item?.type || "file"),
              sourceParentId: sourceParentId ?? "",
            },
          });
          return { ok: true };
        }

        case "download": {
          try {
            await fileService.downloadSingleItem(id, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to download item" };
          }
        }

        case "details": {
          router.push(`/(stack)/details/${id}`);
          return { ok: true };
        }

        case "star": {
          const nextStarred = !isStarred;
          try {
            await fileService.setStarred(id, nextStarred, token);
            return { ok: true };
          } catch (err) {
            return { ok: false, error: err?.message || "Failed to update star status" };
          }
        }

        // Share is a separate screen
        case "share": {
          router.push(`/(stack)/share/${id}`);
          return { ok: true };
        }

        default:
          return { ok: false, error: "Action not implemented" };
      }
    }
  }
}
