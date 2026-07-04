/**
 * Permission Export Excel API Route
 * Proxies Excel export download to the backend API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyEntityExcelExport } from '@/lib/api/exportProxy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('role_id') ?? searchParams.get('roleId');

  if (!roleId) {
    return NextResponse.json(
      {
        success: false,
        message: 'roleId is required',
        error: 'roleId query parameter is required for permissions export',
      },
      { status: 400 }
    );
  }

  return proxyEntityExcelExport(request, {
    entityPath: 'permissions',
    defaultFilename: `rbac-permissions-role-${roleId}.xlsx`,
    defaultSortBy: 'menu_id',
    failureMessage: 'Failed to export permissions',
    logPrefix: 'Permission',
    extraQueryParams: { role_id: roleId },
  });
}
