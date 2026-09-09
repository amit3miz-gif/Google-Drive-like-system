import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

/**
 * TopBar
 * Minimal Drive-like top bar.
 * Uses Google Material Symbols.
 *
 * Props:
 * - value: current search query (controlled)
 * - onSearchChange: (nextValue) => void
 * - onSearchFocus: () => void  (opens SearchOverlay)
 */

export default function TopBar({ value = "", onSearchChange, onSearchFocus }) {
  const { logout, token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Build avatar src from backend fields: pictureData + pictureContentType
  const avatarSrc = useMemo(() => {
    const data = user?.pictureData;
    const ct = user?.pictureContentType;
    if (!data || !ct) return "";
    return `data:${ct};base64,${data}`;
  }, [user?.pictureData, user?.pictureContentType]);

  const fallbackLetter = useMemo(() => {
    const name = String(user?.name || "").trim();
    const email = String(user?.username || "").trim();
    const base = name || email || "?";
    return base[0]?.toUpperCase() || "?";
  }, [user?.name, user?.username]);

  return (
    <header className="topbar">
      {/* Left section */}
      <div className="topbar__left">
        <img
          src="/logo.png"
          alt="Drive To Happiness logo"
          className="topbar__logo-img"
        />
        <span className="topbar__title">Drive To Happiness</span>
      </div>

      {/* Center section */}
      <div className="topbar__center">
        <div className="search-box">
          <span className="search-box__icon material-symbols-outlined" aria-hidden="true">
            search
          </span>

          <input
            type="search"
            className="search-box__input"
            placeholder="Search in Drive"
            value={value}
            onFocus={() => onSearchFocus?.()}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="topbar__right">
        <div
          className={`theme-switch ${isDark ? "theme-switch--dark" : ""}`}
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle theme"
        >
          <span className="theme-switch__pill" aria-hidden="true" />

          <button
            type="button"
            className="theme-switch__btn has-tooltip"
            onClick={() => {
              if (isDark) toggleTheme();
            }}
            aria-label="Light mode"
            aria-pressed={!isDark}
          >
            <span className="material-symbols-outlined">light_mode</span>
            <span className="ui-tooltip">Light mode</span>
          </button>

          <button
            type="button"
            className="theme-switch__btn has-tooltip"
            onClick={() => {
              if (!isDark) toggleTheme();
            }}
            aria-label="Dark mode"
            aria-pressed={isDark}
          >
            <span className="material-symbols-outlined">dark_mode</span>
            <span className="ui-tooltip">Dark mode</span>
          </button>
        </div>

        {token && (
          <button
            type="button"
            className="ui-icon-btn has-tooltip"
            aria-label="Logout"
            onClick={logout}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="ui-tooltip ui-tooltip--right">
              Logout{user?.username ? ` (${user.username})` : ""}
            </span>
          </button>
        )}

        <button
          type="button"
          className="help-btn ui-icon-btn has-tooltip"
          aria-label="Support"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="ui-tooltip ui-tooltip--right">Support</span>
        </button>

        {/* Avatar */}
        {token && (
          <button
            type="button"
            className="avatar-btn has-tooltip"
            aria-label="Account"
          >
            {avatarSrc ? (
              <img className="avatar-img" src={avatarSrc} alt="User avatar" />
            ) : (
              <span className="avatar-fallback">{fallbackLetter}</span>
            )}

            <span className="ui-tooltip ui-tooltip--right">
              {user?.name || "Account"}
              {user?.username ? ` (${user.username})` : ""}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
