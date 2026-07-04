/**
 * Roles Active List API Route
 * Handles fetching active roles list
 */

import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch, resolveRouteAuthToken } from '@/lib/api/backendProxy';

/**
 * GET /api/v1/roles/active/list
 * Fetch list of active roles
 */
export async function GET(request: NextRequest) {
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

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles/active/list`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'GET',
        authToken,
        noCache: true,
      });
    } catch (fetchError) {
      console.error('[Role Active List API] Fetch error:', fetchError);
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to fetch active roles' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch active roles',
          error: errorData.error || errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Active roles fetched successfully',
        data: data.data || data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Role Active List API] Error:', error);
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




