import { useState, useCallback, useRef } from "react";

interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

export interface UsePaginationOptions {
  /**
   * Items per page
   * @default 20
   */
  perPage?: number;

  /**
   * Initial page
   * @default 1
   */
  initialPage?: number;
}

export interface UsePaginationReturn extends Pagination {
  /**
   * Go to specific page
   */
  goToPage: (page: number) => void;

  /**
   * Go to next page
   */
  nextPage: () => void;

  /**
   * Go to previous page
   */
  prevPage: () => void;

  /**
   * Reset to first page
   */
  reset: () => void;

  /**
   * Get paginated items
   */
  getPaginatedItems: <T>(items: T[]) => T[];

  /**
   * Check if on first page
   */
  isFirstPage: boolean;

  /**
   * Check if on last page
   */
  isLastPage: boolean;

  /**
   * Total pages
   */
  totalPages: number;
}

/**
 * Hook for managing pagination state and logic
 */
export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationReturn {
  const { perPage = 20, initialPage = 1 } = options;

  const [page, setPage] = useState(initialPage);
  const totalRef = useRef(0);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  const getPaginatedItems = useCallback(
    <T>(items: T[]): T[] => {
      totalRef.current = items.length;
      const totalPages = Math.max(1, Math.ceil(items.length / perPage));
      const currentPage = Math.min(page, totalPages);

      const start = (currentPage - 1) * perPage;
      const end = start + perPage;

      return items.slice(start, end);
    },
    [page, perPage],
  );

  const total = totalRef.current;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  return {
    page,
    perPage,
    total,
    totalPages,
    isFirstPage,
    isLastPage,
    goToPage,
    nextPage,
    prevPage,
    reset,
    getPaginatedItems,
  };
}
