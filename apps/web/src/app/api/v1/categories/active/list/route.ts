/**
 * Category Active List API Route
 */

import { NextRequest } from 'next/server';
import { proxyCategoryActiveList } from '@/lib/api/categoryEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyCategoryActiveList(request);
  } catch (error) {
    console.error('[Category Active List API] Error:', error);
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
