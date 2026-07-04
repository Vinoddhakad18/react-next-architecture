import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyMenuStatus } from '@/lib/api/menuEncryptedProxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  try {
    return await proxyMenuStatus(request, params.id);
  } catch (error) {
    console.error('[Menu Status API] Error:', error);
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
