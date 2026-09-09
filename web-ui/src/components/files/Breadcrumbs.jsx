export default function Breadcrumbs({ path = [], onNavigate }) {
  // path example: [{ id: null, name: 'My Drive' }, { id: '123', name: 'Docs' }]
  if (!path.length) {
    return <div className="breadcrumbs">My Drive</div>;
  }

  return (
    <div className="breadcrumbs">
      {path.map((p, idx) => {
        const isLast = idx === path.length - 1;

        return (
          <span key={p.id ?? `root-${idx}`} className="breadcrumbs__item">
            <button
              type="button"
              className="breadcrumbs__btn"
              disabled={isLast}
              onClick={() => onNavigate?.(p, idx)}
            >
              {p.name}
            </button>
            {!isLast && <span className="breadcrumbs__sep">/</span>}
          </span>
        );
      })}
    </div>
  );
}
