# Permissions and Sharing

## Overview
The application supports controlled sharing of files and folders between users.
Permissions are enforced strictly by the backend.

---

## Ownership
- Each file or folder has a single owner
- The owner has full control over the item


## Sharing
- Files and folders can be shared with other users by email
- Shared users gain access without merging Drive hierarchies
- Each user maintains an independent Drive tree

<img width="280" height="395" alt="image" src="https://github.com/user-attachments/assets/615bf768-34c8-47ef-b3e3-246d7a59baea" />

---

## Permission Levels

The application supports multiple permission levels when sharing files and folders.
Each permission level defines the actions a user is allowed to perform on a shared item.

### Viewer
- Can view files and folders
- Can download files
- Cannot edit, rename, or reshare items
- Deleting an item removes the user's access (permission) only and does not permanently delete the item

### Editor
- Can view and edit files
- Can rename items

### Manager
- Full access to the shared item
- Can view, edit, rename
- Can manage sharing permissions for other users
- Cannot remove the original owner

---

## Permission Enforcement
Before executing any operation, the backend validates:
- The user’s authentication status
- The user’s permission level for the requested item
- The requested action against the allowed operations for that permission

<img width="271" height="541" alt="image" src="https://github.com/user-attachments/assets/2b588f96-d0ba-4ac2-a839-efd70766456c" />

---
