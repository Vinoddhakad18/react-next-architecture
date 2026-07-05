import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyBranchSoftDelete, proxyBranchUpdate } from '@/lib/api/branchEncryptedProxy';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    return await proxyBranchUpdate(request, params.id);
  } catch (error) {
    console.error('[Branch Item API PUT] Error:', error);
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

    return await proxyBranchSoftDelete(request, params.id);
  } catch (error) {
    console.error('[Branch Soft Delete API] Error:', error);
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
