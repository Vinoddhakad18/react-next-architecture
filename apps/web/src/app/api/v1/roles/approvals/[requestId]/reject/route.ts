import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyRoleApprovalAction } from '@/lib/api/roleEncryptedProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  return proxyRoleApprovalAction(request, params.requestId, 'reject');
}
