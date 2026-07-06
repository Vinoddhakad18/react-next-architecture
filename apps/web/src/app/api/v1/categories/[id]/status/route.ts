/**
 * Category Status API Route
 * Proxies status toggle with encrypted backend communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyCategoryStatus } from '@/lib/api/categoryEncryptedProxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  try {
    return await proxyCategoryStatus(request, params.id);
  } catch (error) {
    console.error('[Category Status API] Error:', error);
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
