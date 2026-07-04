/**
 * Build and read list API query strings using snake_case keys.
 */

export interface ListQueryInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

/** Build a snake_case query string for list endpoints. */
export function buildListQueryString(params?: ListQueryInput): string {
  if (!params) {
    return '';
  }

  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', params.page.toString());
  }
  if (params.limit) {
    query.set('per_page', params.limit.toString());
  }
  if (params.sortBy) {
    query.set('sort_by', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sort_order', params.sortOrder);
  }
  if (params.search) {
    query.set('search', params.search);
  }
  if (params.isActive !== undefined) {
    query.set('is_active', params.isActive.toString());
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export interface BackendListQuery {
  page: string;
  per_page: string;
  sort_by: string;
  sort_order: string;
  search: string;
  is_active: string | null;
}

/** Read list query params (snake_case or legacy camelCase) from an incoming request. */
export function readListQueryParams(searchParams: URLSearchParams, defaults: {
  sort_by?: string;
  per_page?: string;
} = {}): BackendListQuery {
  return {
    page: searchParams.get('page') ?? '1',
    per_page:
      searchParams.get('per_page') ??
      searchParams.get('limit') ??
      defaults.per_page ??
      '10',
    sort_by:
      searchParams.get('sort_by') ??
      searchParams.get('sortBy') ??
      defaults.sort_by ??
      'id',
    sort_order:
      searchParams.get('sort_order') ??
      searchParams.get('sortOrder') ??
      'ASC',
    search: searchParams.get('search') ?? '',
    is_active: searchParams.get('is_active') ?? searchParams.get('isActive'),
  };
}

/** Serialize list query params for the backend (always snake_case). */
export function toBackendListQueryString(
  params: BackendListQuery,
  options?: { includeCacheBuster?: boolean }
): string {
  const query = new URLSearchParams({
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
  });

  if (params.search) {
    query.set('search', params.search);
  }
  if (params.is_active !== null && params.is_active !== undefined && params.is_active !== '') {
    query.set('is_active', params.is_active);
  }
  if (options?.includeCacheBuster) {
    query.set('_t', Date.now().toString());
  }

  return query.toString();
}
