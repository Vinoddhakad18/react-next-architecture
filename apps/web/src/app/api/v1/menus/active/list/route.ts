import { NextRequest } from 'next/server';

import { proxyMenuActiveList } from '@/lib/api/menuEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyMenuActiveList(request);
  } catch (error) {
    console.error('[Menu Active List API] Error:', error);
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
