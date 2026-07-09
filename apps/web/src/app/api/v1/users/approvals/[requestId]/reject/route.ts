import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyUserApprovalAction } from '@/lib/api/userEncryptedProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  return proxyUserApprovalAction(request, params.requestId, 'reject');
}
