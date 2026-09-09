import { ALLOWED_EXTENSIONS } from "./fileConstants";

// Splits filename into base and extension
function splitNameAndExtension(name) {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) {
    return { base: name, ext: "" };
  }
  return {
    base: name.slice(0, lastDot),
    ext: name.slice(lastDot),
  };
}

// Checks if the filename has an allowed extension
function hasAllowedExtension(name) {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Renames a file or folder item
export async function handleRenameItem(item, token, fileService) {
  try {
    if (item.type === "folder") {
      const input = window.prompt("Enter new folder name:", item.name);
      if (input == null) return;

      const newName = input.trim();
      if (!newName) {
        window.alert("Name cannot be empty.");
        return;
      }

      await fileService.update(item.id, { name: newName }, token);
      return;
    }

    const { base, ext } = splitNameAndExtension(item.name);
    const currentBase = base || item.name;

    const input = window.prompt("Enter new file name:", currentBase);
    if (input == null) return;

    const newBase = input.trim();
    if (!newBase) {
      window.alert("Name cannot be empty.");
      return;
    }

    if (ext) {
      if (newBase.includes(".")) {
        window.alert(
          "You cannot change the file extension. Please rename only the name before the extension."
        );
        return;
      }

      const newName = newBase + ext;

      if (!hasAllowedExtension(newName)) {
        window.alert(
          "Unsupported file extension after rename. Allowed: .jpeg, .jpg, .png, .gif, .webp, .svg, .txt"
        );
        return;
      }

      await fileService.update(item.id, { name: newName }, token);
      return;
    }

    if (newBase.includes(".")) {
      const candidate = newBase;
      if (!hasAllowedExtension(candidate)) {
        window.alert(
          "Unsupported file extension. Allowed: .jpeg, .jpg, .png, .gif, .webp, .svg, .txt"
        );
        return;
      }
      await fileService.update(item.id, { name: candidate }, token);
      return;
    }

    await fileService.update(item.id, { name: newBase }, token);
  } catch (err) {
    const status = err?.status || err?.response?.status;
    if (status === 403) {
      window.alert("You do not have permission to rename this item.");
      return;
    }
    window.alert(err?.message || "Failed to rename item.");
  }
}

