import { NextRequest } from 'next/server';

import { proxyMenuTree } from '@/lib/api/menuEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyMenuTree(request);
  } catch (error) {
    console.error('[Menu Tree API] Error:', error);
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
