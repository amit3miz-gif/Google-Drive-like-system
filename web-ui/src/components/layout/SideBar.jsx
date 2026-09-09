import { NavLink } from "react-router-dom";

function NavItem({ to, icon, label, tooltip, end = false, disableTooltip = false }) {
  const withTooltip = !disableTooltip && !!tooltip;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-item ${isActive ? "nav-item--active" : ""} ${withTooltip ? "has-tooltip" : ""}`
      }
      aria-label={tooltip || label}
    >
      <span className="nav-item__icon material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>

      <span className="nav-item__label">{label}</span>

      {withTooltip ? (
        <span className="ui-tooltip" role="tooltip">
          {tooltip}
        </span>
      ) : null}
    </NavLink>
  );
}

// Sidebar container holding primary navigation links for the app
export default function SideBar() {
  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <nav className="nav" aria-label="Navigation">
        <NavItem to="my-drive" icon="home" label="My Drive" end disableTooltip />

        <NavItem
          to="shared-with-me"
          icon="people"
          label="Shared with me"
          tooltip="Items shared with me"
        />

        <NavItem to="recent" icon="schedule" label="Recent" tooltip="Recent items" />

        <NavItem to="starred" icon="star" label="Starred" tooltip="Starred items" />

        <NavItem to="trash" icon="delete" label="Bin" tooltip="Binned items" />
      </nav>
    </aside>
  );
}
