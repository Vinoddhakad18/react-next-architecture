/**
 * Role Export Excel API Route
 * Proxies Excel export with encrypted query params.
 */

import { NextRequest } from 'next/server';
import { proxyRoleExcelExport } from '@/lib/api/roleEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyRoleExcelExport(request);
}
