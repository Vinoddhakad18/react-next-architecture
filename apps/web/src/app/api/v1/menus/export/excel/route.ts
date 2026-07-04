/**
 * Menu Export Excel API Route
 * Proxies Excel export download to the backend API.
 */

import { NextRequest } from 'next/server';
import { proxyEntityExcelExport } from '@/lib/api/exportProxy';

export async function GET(request: NextRequest) {
  return proxyEntityExcelExport(request, {
    entityPath: 'menus',
    defaultFilename: 'menus-export.xlsx',
    defaultSortBy: 'sort_order',
    failureMessage: 'Failed to export menus',
    logPrefix: 'Menu',
  });
}
