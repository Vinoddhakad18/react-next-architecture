/**
 * Branch Status API Route
 * Proxies status toggle to the backend API.
 */

import { NextRequest } from 'next/server';
import { proxyEntityStatus } from '@/lib/api/statusProxy';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyEntityStatus(request, 'branches', params.id, 'Branch');
}
