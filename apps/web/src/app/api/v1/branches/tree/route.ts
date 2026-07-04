/**
 * Branch Tree API Route
 * Fetches the active branch tree from the backend and normalizes field names.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BACKEND_API_URL, getBackendApiKey } from '@/lib/api/backendConfig';
import { extractBranchTreePayload } from '@/lib/utils/normalizeBranchTree';
import { readEncryptedActiveOnlyFromRequest } from '@/lib/api/encryptedListQuery';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;

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
    const queryParams = new URLSearchParams();

    if (readEncryptedActiveOnlyFromRequest(searchParams)) {
      queryParams.append('active_only', 'true');
    }

    queryParams.append('_t', Date.now().toString());
    const backendUrl = `${BACKEND_API_URL}/api/v1/branches/tree?${queryParams.toString()}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Branch Tree API] Fetch error:', fetchError);
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
        errorData = { message: errorText || 'Failed to fetch branch tree' };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch branch tree',
          error: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const branchTree = extractBranchTreePayload(data);

    return NextResponse.json(
      {
        success: true,
        message: 'Branch tree retrieved successfully',
        data: branchTree,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Branch Tree API] Error:', error);
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
