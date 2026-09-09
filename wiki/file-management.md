# File Management

## Overview
The file management system provides each user with a personal virtual Drive,
containing folders and files organized in a hierarchical structure.

All file operations are validated and executed on the backend, while the
React Native application serves as a client that presents and triggers these operations.

---

## Supported Operations
Users can perform the following actions on files and folders:

- Create new files and folders
- Rename items
- Move items between folders
- Delete items (move to Trash)
- Restore items from Trash
- Permanently delete items
- Mark and unmark items as **Starred**
- Download files to the local device
- Upload files and images
- View detailed metadata of files and folders
- Share items with other users

<img width="278" height="559" alt="image" src="https://github.com/user-attachments/assets/050be262-d74d-4da7-9d6d-34a2528db7f2" />

---

## Creating Files and Folders
- Users can create new files and folders within their personal Drive
- New items are created inside the currently selected folder
- Each created item is associated with the authenticated user as its owner
- Folder structures are maintained hierarchically on the backend

<img width="278" height="532" alt="image" src="https://github.com/user-attachments/assets/f3ec3420-2732-490c-90cc-25d778df254f" />

---

## Renaming Items
- Files and folders can be renamed by users with sufficient permissions
- Renaming an item updates its metadata without affecting its contents or location
- Name changes are immediately reflected across all application views

<img width="280" height="532" alt="image" src="https://github.com/user-attachments/assets/503586a5-e0d2-4e70-8c48-f37441e4b4ef" />

---

## Moving Items Between Folders
- Files and folders can be moved between folders within the Drive
- Moving an item updates its parent folder while preserving ownership and permissions
- The operation maintains folder hierarchy consistency and prevents invalid moves

<img width="276" height="572" alt="image" src="https://github.com/user-attachments/assets/0d40db70-3f8a-426e-acde-5f49c8b9029b" />

---

## Viewing Item Details
- Users can view detailed information about files and folders
- Details include type, owner, creation time, modification time, and sharing status
- A dedicated details panel is available from the UI

<img width="277" height="358" alt="image" src="https://github.com/user-attachments/assets/5cb6b83d-e8f2-427d-9a62-328c58cdff65" />

---

## Uploading Files and Images
- Users can upload files and images from their device into the Drive
- Supported file types are validated before upload

<img width="278" height="566" alt="image" src="https://github.com/user-attachments/assets/66f9c192-b2ec-47b7-b32a-fdb9e88336df" />
<img width="278" height="550" alt="image" src="https://github.com/user-attachments/assets/29776059-0059-4765-84a8-dda89f5aa7ad" />

---

## Downloading Files
- Files can be downloaded from the Drive to the user's local device

---

## Starred Items
- Users can mark files and folders as **Starred**
- Starred items are easily accessible from a dedicated Starred page

---

## Sharing Files and Folders
- Files and folders can be shared with other users
- Sharing is performed by specifying the recipient's email address
- Permissions are enforced by the backend and reflected in the UI

<img width="279" height="562" alt="image" src="https://github.com/user-attachments/assets/e46c1257-5a14-4bdd-8006-2c371be8eb0f" />

---

## Search
- Users can search for files and folders by name or content
- Search results include all items the user has permission to access
- Selecting a search result opens the item in the appropriate viewer

<img width="278" height="538" alt="image" src="https://github.com/user-attachments/assets/e1118094-8ef6-4f94-8cac-3cca64ed5dcb" />

---

## Deletion and Trash Management
- Users can delete files and folders, which moves them to a logical **Trash** rather than removing them immediately
- Deleted items remain in the Trash until explicitly removed or restored
- Items can be restored from the Trash to their original location
- Users can permanently delete items from the Trash
- Permanent deletion removes the item and its associated metadata from the system

<img width="279" height="550" alt="image" src="https://github.com/user-attachments/assets/e3a03640-153e-49e7-a29a-f81e6b34cd45" />

---

## Application Pages

The application organizes file access using several dedicated pages:

### Home
- Displays the user's personal Drive
- Shows the folder hierarchy and contained files
- Serves as the main workspace

<img width="277" height="556" alt="image" src="https://github.com/user-attachments/assets/c5bc661a-7c08-4ba7-abcf-48ed7d7d61b7" />
<img width="277" height="564" alt="image" src="https://github.com/user-attachments/assets/dd8ccf6f-42ea-4bce-a00c-a8e30502f2f2" />

### Shared
- Displays files and folders shared with the user by others
- Shared items appear without merging Drive hierarchies

<img width="277" height="564" alt="image" src="https://github.com/user-attachments/assets/ae28898b-7973-4f42-a0f2-be6dc41978f3" />

### Recent
- Displays files and folders recently modified
- Allows quick access to recent work

<img width="279" height="538" alt="image" src="https://github.com/user-attachments/assets/0f409faa-2645-47df-b204-7814e5b55495" />

### Starred
- Displays all items marked as Starred by the user
- Provides fast access to important files and folders

<img width="277" height="559" alt="image" src="https://github.com/user-attachments/assets/63f572b7-83b5-4542-a373-b1da788bccd3" />

### Trashed
- Displays items that were deleted by the user
- Items can be restored to their original location or permanently removed

<img width="278" height="553" alt="image" src="https://github.com/user-attachments/assets/918d39df-781f-4d5a-b1ba-7c395642853f" />

---

## Additional Features

### Dark Mode
- The application supports a dark mode theme for improved usability in low-light environments
- Users can toggle dark mode from the side bar
- Theme changes are applied consistently across all screens

---

### Grid and List Views
- Files and folders can be displayed in different layout modes
- Users can switch between:
  - Grid view
  - List view
 
<img width="281" height="560" alt="image" src="https://github.com/user-attachments/assets/00071d4c-0ece-4580-a008-fb4e0c88da63" />

---

### Alphabetical Sorting
- Items can be sorted alphabetically by name
- Sorting improves usability when browsing large collections of files

---
