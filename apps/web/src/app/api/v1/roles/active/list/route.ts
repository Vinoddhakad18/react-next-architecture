/**
 * Roles Active List API Route
 * Fetches active roles with encrypted backend communication.
 */

import { NextRequest } from 'next/server';
import { proxyRoleActiveList } from '@/lib/api/roleEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyRoleActiveList(request);
  } catch (error) {
    console.error('[Role Active List API] Error:', error);
    return Response.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
