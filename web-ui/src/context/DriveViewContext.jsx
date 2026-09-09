import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGlobalDriveView } from "../hooks/useGlobalDriveView";

// Context object
const DriveViewContext = createContext(null);

// Provider wraps the app and exposes the viewer state
export function DriveViewProvider({ children }) {
  const { token } = useAuth();
  const driveView = useGlobalDriveView({ token }); // ONE global instance

  return (
    <DriveViewContext.Provider value={driveView}>
      {children}
    </DriveViewContext.Provider>
  );
}

// Convenience hook for consuming the context
export function useDriveView() {
  const ctx = useContext(DriveViewContext);
  if (!ctx) {
    throw new Error("useDriveView must be used inside DriveViewProvider");
  }
  return ctx;
}
