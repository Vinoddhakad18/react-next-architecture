/**
 * Role Export Excel API Route
 * Proxies Excel export download to the backend API.
 */

import { NextRequest } from 'next/server';
import { proxyEntityExcelExport } from '@/lib/api/exportProxy';

export async function GET(request: NextRequest) {
  return proxyEntityExcelExport(request, {
    entityPath: 'roles',
    defaultFilename: 'roles-export.xlsx',
    defaultSortBy: 'id',
    failureMessage: 'Failed to export roles',
    logPrefix: 'Role',
  });
}
