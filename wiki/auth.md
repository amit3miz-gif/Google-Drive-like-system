# Authentication and Registration

## Overview
The application supports user registration and authentication.
Each user operates within an isolated Drive environment, identified by their account.

---

## Registration
- New users can register using an email and password
- Each email uniquely identifies a user
- Registration creates a new, empty Drive for the user

<img width="264" height="522" alt="image" src="https://github.com/user-attachments/assets/651bbe18-11f9-4ee3-8ae0-0be1a0d09a6e" />

---

## Login
- Registered users can log in using their credentials
- After login, all application actions are performed in the context of the authenticated user
- Authentication tokens are used to authorize backend requests

<img width="273" height="397" alt="image" src="https://github.com/user-attachments/assets/75c368c2-9eb6-4457-a9fd-e7d5aea74748" />

---

## Session Handling
- Only one user session is active at a time
- Logging out clears the session and returns the user to the login screen

---

## Design Notes
Authentication is handled independently from file and permission logic,
allowing future extensions such as:
- Persistent sessions
- External authentication providers
