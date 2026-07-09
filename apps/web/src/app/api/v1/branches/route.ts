/**
 * Branches API Route
 * Proxy for branch list and creation operations with encrypted backend communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyBranchCreate, proxyBranchList } from '@/lib/api/branchEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyBranchList(request);
  } catch (error) {
    console.error('[Branches API] Error:', error);
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

export async function POST(request: NextRequest) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    return await proxyBranchCreate(request);
  } catch (error) {
    console.error('[Branches API POST] Error:', error);
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
