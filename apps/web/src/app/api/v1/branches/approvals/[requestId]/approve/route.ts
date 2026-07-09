import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyBranchApprovalAction } from '@/lib/api/branchEncryptedProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  return proxyBranchApprovalAction(request, params.requestId, 'approve');
}
