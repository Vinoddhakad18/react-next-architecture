import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyUserSoftDelete, proxyUserUpdate } from '@/lib/api/userEncryptedProxy';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    return await proxyUserUpdate(request, params.id);
  } catch (error) {
    console.error('[User Item API PUT] Error:', error);
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

    return await proxyUserSoftDelete(request, params.id);
  } catch (error) {
    console.error('[User Soft Delete API] Error:', error);
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
