import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DrivePage from '../pages/DrivePage';
import SharedWithMePage from "../pages/SharedWithMePage";
import StarredPage from "../pages/StarredPage";
import RecentPage from "../pages/RecentPage";
import TrashPage from "../pages/TrashPage";
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect'; 

import MainLayout from "../components/layout/MainLayout";
import { DriveViewProvider } from "../context/DriveViewContext";

// Central route configuration for the app
const routes = [
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Protected routes
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        {/* ONE global viewer for all /app pages */}
        <DriveViewProvider>
          <MainLayout />
        </DriveViewProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DrivePage /> },
      { path: "my-drive", element: <DrivePage /> },
      { path: "shared-with-me", element: <SharedWithMePage /> },
      { path: "recent", element: <RecentPage /> },
      { path: "starred", element: <StarredPage /> },
      { path: "trash", element: <TrashPage /> },
    ],
  },

  // "/" redirects based on auth state
  { path: '/', element: <RootRedirect /> },
];

export default routes;