export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
}

/**
 * Converts { page, limit } into Prisma's { skip, take }.
 */
export const getPrismaPagination = ({ page, limit }: PaginationParams) => ({
  skip: (page - 1) * limit,
  take: limit,
});

/**
 * Builds the `meta` block attached to paginated list responses.
 */
export const buildPaginationMeta = (
  { page, limit }: PaginationParams,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
