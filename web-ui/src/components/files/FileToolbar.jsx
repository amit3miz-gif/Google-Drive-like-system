export default function FileToolbar({
  view = "list",
  onChangeView,
  onViewDetails,
  canViewDetails = false,
}) {
  return (
    <div className="file-toolbar">
      <div className="file-toolbar__right">
        <button
          type="button"
          className="icon-btn ui-icon-btn has-tooltip"
          aria-label="View details"
          onClick={() => onViewDetails?.()}
          disabled={!canViewDetails}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
          <span className="ui-tooltip ui-tooltip--right" role="tooltip">
            View details
          </span>
        </button>

        <div
          className={`view-toggle view-toggle--${view}`}
          role="group"
          aria-label="View toggle"
        >
          <span className="view-toggle__pill" aria-hidden="true" />

          <button
            type="button"
            className="view-toggle__btn has-tooltip"
            onClick={() => onChangeView?.("list")}
            aria-pressed={view === "list"}
            aria-label="List layout"
          >
            <span className="icon icon--list" aria-hidden="true" />
            <span className="ui-tooltip" role="tooltip">
              List layout
            </span>
          </button>

          <button
            type="button"
            className="view-toggle__btn has-tooltip"
            onClick={() => onChangeView?.("grid")}
            aria-pressed={view === "grid"}
            aria-label="Grid layout"
          >
            <span className="icon icon--grid" aria-hidden="true" />
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Grid layout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
