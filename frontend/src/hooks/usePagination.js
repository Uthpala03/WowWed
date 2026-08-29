import { useCallback, useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZES = [25, 50, 100, 250];
export const COMPACT_PAGE_SIZES = [10, 25, 50, 100];
export const TABLE_PAGE_SIZES = [6, 8, 12, 24];

export function usePagination(items, options = {}) {
  const {
    initialPage = 1,
    initialPageSize = 50,
    pageSizes = DEFAULT_PAGE_SIZES,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages));
  }, [totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const pageStart = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, totalItems);

  const setPageSize = (size) => {
    setPageSizeState(Number(size) || initialPageSize);
    setPage(1);
  };

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageSizes,
    totalPages,
    totalItems,
    pageItems,
    pageStart,
    pageEnd,
    resetPage,
  };
}
