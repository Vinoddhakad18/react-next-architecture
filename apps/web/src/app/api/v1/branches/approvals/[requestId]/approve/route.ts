import { NextRequest } from 'next/server';

import { proxyModuleApprovalAction } from '@/lib/api/approvalProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  return proxyModuleApprovalAction(request, 'branches', params.requestId, 'approve');
}
