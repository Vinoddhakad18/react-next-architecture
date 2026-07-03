/**
 * Proxy user approval actions — delegates to shared module proxy.
 */

import { NextRequest } from 'next/server';

import { proxyModuleApprovalAction } from './approvalProxy';

type ApprovalAction = 'approve' | 'reject';

export async function proxyUserApprovalAction(
  request: NextRequest,
  requestId: string,
  action: ApprovalAction
) {
  return proxyModuleApprovalAction(request, 'users', requestId, action);
}
