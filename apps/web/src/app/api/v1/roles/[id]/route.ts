import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import {
  proxyRoleDelete,
  proxyRoleGet,
  proxyRoleUpdate,
} from '@/lib/api/roleEncryptedProxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await proxyRoleGet(request, params.id);
  } catch (error) {
    console.error('[Role API] GET error:', error);
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

    return await proxyRoleUpdate(request, params.id);
  } catch (error) {
    console.error('[Role API] PUT error:', error);
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

    return await proxyRoleDelete(request, params.id);
  } catch (error) {
    console.error('[Role API] DELETE error:', error);
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
