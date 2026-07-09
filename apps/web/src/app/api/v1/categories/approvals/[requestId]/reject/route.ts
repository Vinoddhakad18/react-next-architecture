import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyCategoryApprovalAction } from '@/lib/api/categoryEncryptedProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const csrfValidation = await validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  return proxyCategoryApprovalAction(request, params.requestId, 'reject');
}
