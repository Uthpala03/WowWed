import PrettySelect from './PrettySelect';
import { DEFAULT_PAGE_SIZES } from '../../hooks/usePagination';

function buildPageRange(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, idx) => {
    if (idx > 0 && p - sorted[idx - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

export default function ListPagination({
  page,
  totalPages,
  pageStart,
  pageEnd,
  totalItems,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  icon = 'guests',
  label = 'Rows',
  className = '',
  compact = false,
  variant = 'default',
  showSummary = true,
  showPageNumbers = true,
  showFirstLast = true,
}) {
  if (totalItems === 0) return null;

  const resolvedVariant = variant === 'default' && compact ? 'compact' : variant;
  const pageRange = showPageNumbers ? buildPageRange(page, totalPages) : [];

  return (
    <div
      className={[
        'list-pagination',
        resolvedVariant !== 'default' ? `list-pagination--${resolvedVariant}` : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="list-pagination__meta">
        <PrettySelect
          label={label}
          icon={icon}
          value={pageSize}
          options={pageSizes.map((size) => ({ value: size, label: `${size} per page`, icon }))}
          onChange={(value) => onPageSizeChange(Number(value))}
        />
        {showSummary && (
          <span className="list-pagination__summary">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalItems}</strong>
          </span>
        )}
      </div>

      <nav className="list-pagination__nav" aria-label="Pagination">
        {showFirstLast && (
          <button
            type="button"
            className="list-pagination__btn list-pagination__btn--ghost"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            «
          </button>
        )}
        <button
          type="button"
          className="list-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>

        {showPageNumbers && totalPages > 1 && (
          <div className="list-pagination__pages">
            {pageRange.map((item, idx) => (
              item === '…' ? (
                <span key={`gap-${idx}`} className="list-pagination__ellipsis">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`list-pagination__page${item === page ? ' is-active' : ''}`}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            ))}
          </div>
        )}

        <button
          type="button"
          className="list-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
        {showFirstLast && (
          <button
            type="button"
            className="list-pagination__btn list-pagination__btn--ghost"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            »
          </button>
        )}
      </nav>
    </div>
  );
}
