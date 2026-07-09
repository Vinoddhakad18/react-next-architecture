/**
 * Branch Status API Route
 * Proxies status toggle to the backend API with encrypted communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyBranchStatus } from '@/lib/api/branchEncryptedProxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  try {
    return await proxyBranchStatus(request, params.id);
  } catch (error) {
    console.error('[Branch Status API] Error:', error);
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
