/**
 * Branch Export Excel API Route
 * Proxies Excel export download to the backend API.
 */

import { NextRequest } from 'next/server';
import { proxyEntityExcelExport } from '@/lib/api/exportProxy';

export async function GET(request: NextRequest) {
  return proxyEntityExcelExport(request, {
    entityPath: 'branches',
    defaultFilename: 'branches-export.xlsx',
    defaultSortBy: 'branch_name',
    failureMessage: 'Failed to export branches',
    logPrefix: 'Branch',
  });
}
