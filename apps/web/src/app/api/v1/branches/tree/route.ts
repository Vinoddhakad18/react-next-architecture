/**
 * Branch Tree API Route
 * Fetches the active branch tree from the backend with encrypted communication.
 */

import { NextRequest } from 'next/server';
import { proxyBranchTree } from '@/lib/api/branchEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyBranchTree(request);
  } catch (error) {
    console.error('[Branch Tree API] Error:', error);
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
