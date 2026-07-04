/**
 * Menus API Route
 * Handles menu management operations with encrypted backend communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { invalidateMenuCachePattern } from '@/lib/utils/cache';
import { proxyMenuCreate, proxyMenuList } from '@/lib/api/menuEncryptedProxy';
import { resolveAuthTokenFromRequest } from '@/lib/api/encryptedRouteProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyMenuList(request);
  } catch (error) {
    console.error('Menu API error:', error);
    return Response.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const response = await proxyMenuCreate(request);

    if (response.status >= 200 && response.status < 300) {
      const authToken = await resolveAuthTokenFromRequest(request);
      if (authToken) {
        try {
          await invalidateMenuCachePattern(authToken, 'menu:*');
        } catch (cacheError) {
          console.error('[Menu API] Cache invalidation error (non-blocking):', cacheError);
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Menu API POST error:', error);
    return Response.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
