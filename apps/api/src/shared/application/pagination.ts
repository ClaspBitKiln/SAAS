// Единый формат пагинации (ADR-008).
export interface PageRequest {
  page: number;   // 1-based
  size: number;   // <= 100
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
