/**
 * User Export Excel API Route
 * Proxies Excel export download to the backend API.
 */

import { NextRequest } from 'next/server';
import { proxyEntityExcelExport } from '@/lib/api/exportProxy';

export async function GET(request: NextRequest) {
  return proxyEntityExcelExport(request, {
    entityPath: 'users',
    defaultFilename: 'users-export.xlsx',
    defaultSortBy: 'name',
    failureMessage: 'Failed to export users',
    logPrefix: 'User',
  });
}
