/**
 * User Export Excel API Route
 * Proxies Excel export with encrypted query params.
 */

import { NextRequest } from 'next/server';
import { proxyUserExcelExport } from '@/lib/api/userEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyUserExcelExport(request);
}
