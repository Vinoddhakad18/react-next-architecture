import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { invalidateMenuCachePattern } from '@/lib/utils/cache';
import {
  proxyMenuDelete,
  proxyMenuGet,
  proxyMenuUpdate,
} from '@/lib/api/menuEncryptedProxy';
import { resolveAuthTokenFromRequest } from '@/lib/api/encryptedRouteProxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await proxyMenuGet(request, params.id);
  } catch (error) {
    console.error('[Menu API] GET error:', error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const response = await proxyMenuUpdate(request, params.id);

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
    console.error('[Menu API] PUT error:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const response = await proxyMenuDelete(request, params.id);

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
    console.error('[Menu API] DELETE error:', error);
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
