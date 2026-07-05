/**
 * Users API Route
 * Proxy for user list and creation with encrypted backend communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { proxyUserCreate, proxyUserList } from '@/lib/api/userEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyUserList(request);
  } catch (error) {
    console.error('[Users API] Error:', error);
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

    return await proxyUserCreate(request);
  } catch (error) {
    console.error('[Users API POST] Error:', error);
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
