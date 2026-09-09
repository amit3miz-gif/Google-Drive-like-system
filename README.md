# My Drive

My Drive is a mobile file management application inspired by Google Drive.
This project was developed as part of Exercise 5 in the Advanced Programming Systems course.

The application is implemented as a React Native app and communicates with a backend API
that manages users, files, permissions, and sharing, with persistent storage based on MongoDB.

---

## Architecture Overview

The system follows a client–server architecture with a clear separation of responsibilities.

- **Frontend (Client)**  
  Implemented as a React Native mobile application.  
  The client is responsible for:
  - User interaction and navigation
  - Rendering files, folders, and application pages
  - Triggering actions such as upload, download, sharing, and starring
  - Communicating with the backend via HTTP APIs

- **Backend (Server)**  
  Exposes a RESTful API that handles all core logic, including:
  - User authentication and authorization
  - File and folder management
  - Permissions and sharing enforcement
  - Validation of user actions

- **Database (MongoDB)**  
  Used for persistent storage of:
  - Users and authentication data
  - File and folder metadata
  - Folder hierarchy
  - Sharing and permission information

This separation allows the system to be easily extended, tested, and adapted to additional clients or future requirements.

---

## Running the Mobile Application

Under the project root directory, helper scripts are provided to simplify running the mobile application with Docker.

Since the mobile application runs on a physical device or emulator, it must be able to communicate with the backend server using the local machine’s LAN IP address. This IP address is injected into the application via environment variables at startup.


### Running on Windows (PowerShell)
For Windows users, a PowerShell script named mobile.ps1 is provided.

The script:

Automatically detects the local IPv4 address of the network interface used for internet access

Sets the EXPO_PUBLIC_API_URL environment variable to http://<LAN_IP>:3000

Builds and starts the mobile service using Docker Compose

To run the mobile application on Windows:

<img width="541" height="77" alt="להריץ מווינדואוס" src="https://github.com/user-attachments/assets/11bfc104-45a7-4f2a-b41a-312e6ad7d96b" />

### Running on Linux

For Linux users, a Bash script named mobile.sh is provided.

The script:

Prompts the user to enter a local IPv4 address

Validates that the input is a valid IPv4 address

Creates or updates a .env file in the project root

Sets the following environment variables:

EXPO_PUBLIC_API_URL=http://<LAN_IP>:3000

LAN_IP=<LAN_IP>

Builds and starts the mobile service using Docker Compose

To run the mobile application on Linux:

<img width="660" height="94" alt="לינוקס" src="https://github.com/user-attachments/assets/35834e05-3ee0-4090-8224-c73c2758f69c" />

### Running Manually (All Operating Systems)

For users who prefer not to use the provided scripts, the mobile application can be started manually.

Update the .env file in the project root directory and set the local machine’s IP address:

EXPO_PUBLIC_API_URL=http://<LAN_IP>:3000

LAN_IP=<LAN_IP>

<img width="588" height="204" alt="env" src="https://github.com/user-attachments/assets/245e6898-15cf-4a19-9850-7acda91b02e2" />

Then run:

docker compose up --build mobile

The application can be launched using:

- Android Emulator

- iOS Simulator

- Physical device via Expo Go

<img width="881" height="718" alt="ברקוד" src="https://github.com/user-attachments/assets/3a33be25-5ec3-4e64-b7fc-5c690d627677" />

## Development Process

This project was developed using an iterative workflow with task management and version control.

### Task Management

The project was managed using JIRA

Work was divided into epics, user stories, and tasks

Each task was tracked with appropriate statuses

### Version Control

Development was performed using Git

All work was done on feature branches

Each Pull Request was reviewed by another team member before merging

