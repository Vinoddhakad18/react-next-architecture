/**
 * Shared BFF proxy for entity status toggle (PATCH .../status).
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch, resolveRouteAuthToken } from '@/lib/api/backendProxy';
import { readErrorMessage, readJsonResponse } from '@/lib/api/parseResponse';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

export async function proxyEntityStatus(
  request: NextRequest,
  entityPath: string,
  id: string,
  logPrefix: string
): Promise<NextResponse> {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

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

    const body = await request.json().catch(() => ({}));
    const backendUrl = `${BACKEND_API_URL}/api/v1/${entityPath}/${id}/status`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'PATCH',
        authToken,
        body,
      });
    } catch (fetchError) {
      console.error(`[${logPrefix} Status API] Fetch error:`, fetchError);
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
          message: readErrorMessage(errorText, 'Failed to update status'),
          error: errorText || 'Failed to update status',
        },
        { status: response.status }
      );
    }

    const data = await readJsonResponse(response);

    return NextResponse.json(
      {
        success: true,
        message: 'Status updated successfully',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${logPrefix} Status API] Error:`, error);
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
