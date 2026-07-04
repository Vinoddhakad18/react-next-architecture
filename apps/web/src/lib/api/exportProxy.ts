/**
 * Shared BFF proxy for entity Excel export downloads.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendBinaryFetch, resolveRouteAuthToken } from '@/lib/api/backendProxy';
import { readErrorMessage } from '@/lib/api/parseResponse';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface EntityExcelExportOptions {
  entityPath: string;
  defaultFilename: string;
  defaultSortBy?: string;
  defaultSortOrder?: string;
  failureMessage?: string;
  logPrefix?: string;
  extraQueryParams?: Record<string, string>;
}

export async function proxyEntityExcelExport(
  request: NextRequest,
  {
    entityPath,
    defaultFilename,
    defaultSortBy = 'id',
    defaultSortOrder = 'ASC',
    failureMessage = `Failed to export ${entityPath}`,
    logPrefix = entityPath,
    extraQueryParams,
  }: EntityExcelExportOptions
): Promise<NextResponse> {
  try {
    const authToken = await resolveRouteAuthToken(request);

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Authentication token is required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort_by') ?? searchParams.get('sortBy') ?? defaultSortBy;
    const sortOrder = searchParams.get('sort_order') ?? searchParams.get('sortOrder') ?? defaultSortOrder;

    const queryParams = new URLSearchParams({
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    const search = searchParams.get('search');
    if (search) {
      queryParams.append('search', search);
    }

    const isActive = searchParams.get('is_active') ?? searchParams.get('isActive');
    if (isActive !== null && isActive !== '') {
      queryParams.append('is_active', isActive);
    }

    if (extraQueryParams) {
      for (const [key, value] of Object.entries(extraQueryParams)) {
        if (value !== '') {
          queryParams.set(key, value);
        }
      }
    }

    const backendUrl = `${BACKEND_API_URL}/api/v1/${entityPath}/export/excel?${queryParams.toString()}`;

    let response: Response;
    try {
      response = await backendBinaryFetch(backendUrl, {
        authToken,
        accept: EXCEL_MIME,
      });
    } catch (fetchError) {
      console.error(`[${logPrefix} Export API] Fetch error:`, fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          success: false,
          message: readErrorMessage(errorText, failureMessage),
          error: errorText || failureMessage,
        },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || EXCEL_MIME);

    const contentDisposition = response.headers.get('Content-Disposition');
    headers.set(
      'Content-Disposition',
      contentDisposition || `attachment; filename="${defaultFilename}"`
    );

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error(`[${logPrefix} Export API] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
