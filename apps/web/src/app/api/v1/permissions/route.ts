/**
 * Permissions API Route
 * Handles RBAC permission matrix GET/PUT with encrypted backend communication.
 */

import { NextRequest } from 'next/server';

import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import {
  proxyPermissionGet,
  proxyPermissionSave,
} from '@/lib/api/permissionEncryptedProxy';

export async function GET(request: NextRequest) {
  try {
    return await proxyPermissionGet(request);
  } catch (error) {
    console.error('[Permission API] GET error:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    return await proxyPermissionSave(request);
  } catch (error) {
    console.error('[Permission API] PUT error:', error);
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
