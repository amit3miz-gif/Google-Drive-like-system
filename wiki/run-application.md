# Running the Application

## Overview
My Drive is a mobile file management application inspired by Google Drive.
In Exercise 5, the application is implemented as a **React Native app**, communicating with a backend API that manages users, files, and permissions.

The backend persists application data using a **MongoDB database**, which stores users, files, folder structures, and permission metadata.

---

## Project Structure

    Drive5/
    
        mobile/     # Mobile application source code (ex5)
    
        web-ui/     # Web application source code (ex4)
      
        web/        # Backend source code (ex3)
      
        src/        # Backend source code (ex1,2)
      
        wiki/       # Project wiki and documentation
      
          auth.md                       # Authentication and Registration
        
          file-management.md            # File management and operations
        
          permissions-and-sharing.md    # Permission Enforcement and Sharing
        
          run-application.md            # About the app

## Application Flow

- The app starts and presents an authentication screen

- After successful login, the user enters their personal Drive

- All interactions are performed through the mobile UI

- The app communicates with the backend using HTTP APIs

---

## Docker Compose Setup

The project uses **Docker Compose** to build and run all system components as a unified environment.
Each service in the compose file corresponds to a specific exercise or architectural layer developed throughout the course.

The `server` service represents the core Drive server implemented in **Exercises 1–2**.  
It is responsible for low-level file handling and concurrent request processing, and listens on port `5555`.
Persistent file data is stored using a mounted volume.

The `web` service corresponds to **Exercise 3** and exposes a RESTful API that serves as the main backend of the system.
It communicates with the Drive server and handles authentication, file management, permissions, and sharing logic.
This service also connects to the database layer.

The `db` service runs a **MongoDB** instance, which is used for persistent storage of users, file metadata, folder hierarchies, and permission information.
This database replaces earlier in-memory approaches.

The `web-ui` service provides the web-based client interface developed in **Exercise 4**, allowing interaction with the system through a browser.

The `mobile` service represents the **React Native mobile application developed in Exercise 5**.
It connects to the backend API and enables mobile access to the Drive system.
Environment variables are used to ensure correct communication between the mobile client and the backend during development.

Additional client services (`cpp-client` and `py-client`) are included for testing and demonstration purposes,
and interact directly with the Drive server.

Using Docker Compose allows all services to be built, started, and connected automatically with a single command,
ensuring consistent configuration and simplifying local development and testing.
