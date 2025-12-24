/**
 * Roles Active List API Route
 * Handles fetching active roles list
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Backend API URL - can be configured via environment variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || 'czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=';

/**
 * GET /api/v1/roles/active/list
 * Fetch list of active roles
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
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

    // Forward request to backend API
    const backendUrl = `${BACKEND_API_URL}/api/v1/roles/active/list`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
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




