import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

export interface UsePaginationOptions {
  perPage?: number;
  initialPage?: number;
  urlKey?: string; // Key for URL parameter, defaults to 'page'
}

export interface UsePaginationReturn extends Pagination {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  getPaginatedItems: <T>(items: T[]) => T[];
  isFirstPage: boolean;
  isLastPage: boolean;
  totalPages: number;
}

export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationReturn {
  const { perPage = 20, initialPage = 1, urlKey = 'page' } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsLengthRef = useRef(0);

  // Initialize page from URL or default to initialPage
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get(urlKey);
    return pageParam ? parseInt(pageParam) : initialPage;
  });

  // Update URL when page changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(urlKey, page.toString());
    setSearchParams(newParams);
  }, [page, urlKey, setSearchParams]);

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
      itemsLengthRef.current = items.length;
      const totalPages = Math.max(1, Math.ceil(items.length / perPage));
      const currentPage = Math.min(page, totalPages);

      const start = (currentPage - 1) * perPage;
      const end = start + perPage;

      return items.slice(start, end);
    },
    [page, perPage],
  );

  const total = itemsLengthRef.current;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

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
