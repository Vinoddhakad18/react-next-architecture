/**
 * Shared BFF proxy for entity soft delete (DELETE .../{id}).
 */

import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch, resolveRouteAuthToken } from '@/lib/api/backendProxy';
import { readErrorMessage, readJsonResponse } from '@/lib/api/parseResponse';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

export async function proxyEntitySoftDelete(
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

    const backendUrl = `${BACKEND_API_URL}/api/v1/${entityPath}/${id}`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'DELETE',
        authToken,
      });
    } catch (fetchError) {
      console.error(`[${logPrefix} Soft Delete API] Fetch error:`, fetchError);
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
          message: readErrorMessage(errorText, 'Failed to delete record'),
          error: errorText || 'Failed to delete record',
        },
        { status: response.status }
      );
    }

    const data = await readJsonResponse(response);

    return NextResponse.json(
      data ?? { success: true, message: 'Record deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[${logPrefix} Soft Delete API] Error:`, error);
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
