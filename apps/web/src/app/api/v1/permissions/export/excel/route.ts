/**
 * Permission Export Excel API Route
 * Proxies Excel export download to the backend API with encrypted query params.
 */

import { NextRequest } from 'next/server';
import { proxyPermissionExcelExport } from '@/lib/api/permissionEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyPermissionExcelExport(request);
}
