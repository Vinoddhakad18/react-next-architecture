import { NextRequest } from 'next/server';

import { proxyUserApprovalAction } from '@/lib/api/userApprovalProxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  return proxyUserApprovalAction(request, params.requestId, 'reject');
}
