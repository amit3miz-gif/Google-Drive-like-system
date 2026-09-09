import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
import SearchOverlay from "../files/SearchOverlay";
import { ThemeProvider } from "../../context/ThemeContext";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";

/**
 * MainLayout
 * - TopBar + SideBar
 * - Outlet for pages
 * - Global search overlay state + query
 * - Theme is applied only to the authenticated Drive layout container
 * - Clears search when logged out / token missing
 */
function MainLayoutShell() {
  const { theme } = useTheme();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Clear search state when token is missing (logout / expired)
  useEffect(() => {
    if (!token) {
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  }, [token]);

  return (
    <div className="app-layout" data-theme={theme}>
      <TopBar
        value={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchFocus={() => setIsSearchOpen(true)}
      />

      <div className="layout-body">
        <SideBar />
        <main className="content" aria-label="Content">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>

      {isSearchOpen && (
        <SearchOverlay
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery(""); // Clear search on close
          }}
        />
      )}
    </div>
  );
}

export default function MainLayout() {
  return (
    <ThemeProvider>
      <MainLayoutShell />
    </ThemeProvider>
  );
}
