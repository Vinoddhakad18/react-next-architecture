/**
 * Branch Export Excel API Route
 * Proxies Excel export download to the backend API with encrypted query params.
 */

import { NextRequest } from 'next/server';
import { proxyBranchExcelExport } from '@/lib/api/branchEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyBranchExcelExport(request);
}
