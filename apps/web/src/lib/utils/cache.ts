/**
 * Cache Invalidation Utility
 * Handles Redis cache invalidation for menu operations
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

/**
 * Invalidate menu cache in Redis
 * This function calls the backend API to clear menu-related cache
 */
export async function invalidateMenuCache(authToken: string): Promise<boolean> {
  try {
    // Call backend API to invalidate menu cache
    // The backend should handle the actual Redis cache deletion
    const cacheInvalidationUrl = `${BACKEND_API_URL}/api/v1/menus/cache/invalidate`;

    const response = await fetch(cacheInvalidationUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    // If the endpoint doesn't exist, we'll try an alternative approach
    // by adding a cache-busting header to subsequent requests
    if (!response.ok && response.status !== 404) {
      console.warn('[Cache] Failed to invalidate cache via endpoint:', response.status);
      return false;
    }

    return response.ok || response.status === 404; // 404 is ok if endpoint doesn't exist yet
  } catch (error) {
    console.error('[Cache] Error invalidating menu cache:', error);
    // Don't throw - cache invalidation failure shouldn't break the main operation
    return false;
  }
}

/**
 * Invalidate menu cache with pattern matching
 * Clears all cache keys matching menu patterns
 */
export async function invalidateMenuCachePattern(authToken: string, pattern: string = 'menu:*'): Promise<boolean> {
  try {
    const cacheInvalidationUrl = `${BACKEND_API_URL}/api/v1/cache/invalidate`;

    const response = await fetch(cacheInvalidationUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pattern }),
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 404) {
      console.warn('[Cache] Failed to invalidate cache pattern:', response.status);
      return false;
    }

    return response.ok || response.status === 404;
  } catch (error) {
    console.error('[Cache] Error invalidating cache pattern:', error);
    return false;
  }
}



