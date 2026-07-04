import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyMenuApprovalAction } from '@/lib/api/menuEncryptedProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  return proxyMenuApprovalAction(request, params.requestId, 'approve');
}
