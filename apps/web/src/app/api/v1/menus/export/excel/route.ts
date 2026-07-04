/**
 * Menu Export Excel API Route
 * Proxies Excel export download to the backend API with encrypted query params.
 */

import { NextRequest } from 'next/server';
import { proxyMenuExcelExport } from '@/lib/api/menuEncryptedProxy';

export async function GET(request: NextRequest) {
  return proxyMenuExcelExport(request);
}
