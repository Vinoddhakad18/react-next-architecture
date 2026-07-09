/**
 * Proxy user approval actions — delegates to encrypted user proxy.
 */

import { NextRequest } from 'next/server';

import { proxyUserApprovalAction as proxyEncryptedUserApprovalAction } from './userEncryptedProxy';

type ApprovalAction = 'approve' | 'reject';

export async function proxyUserApprovalAction(
  request: NextRequest,
  requestId: string,
  action: ApprovalAction
) {
  return proxyEncryptedUserApprovalAction(request, requestId, action);
}
