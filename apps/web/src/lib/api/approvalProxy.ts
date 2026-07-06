/**
 * Proxy module approval actions to the backend (approve / reject by requestId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BACKEND_API_URL } from '@/lib/api/backendConfig';
import { backendFetch } from '@/lib/api/backendProxy';
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

export type ApprovalModule = 'users' | 'roles' | 'menus' | 'branches' | 'categories';

type ApprovalAction = 'approve' | 'reject';

export async function proxyModuleApprovalAction(
  request: NextRequest,
  module: ApprovalModule,
  requestId: string,
  action: ApprovalAction
) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const payload =
      action === 'approve'
        ? {
            comment:
              typeof body?.comment === 'string' && body.comment.trim()
                ? body.comment.trim()
                : '',
          }
        : {
            reason:
              typeof body?.reason === 'string' && body.reason.trim()
                ? body.reason.trim()
                : '',
          };

    if (action === 'approve' && !('comment' in payload && payload.comment)) {
      return NextResponse.json(
        { success: false, message: 'Comment is required', error: 'Comment is required' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !('reason' in payload && payload.reason)) {
      return NextResponse.json(
        { success: false, message: 'Reason is required', error: 'Reason is required' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/api/v1/${module}/approvals/${requestId}/${action}`;

    let response: Response;
    try {
      response = await backendFetch(backendUrl, {
        method: 'POST',
        authToken,
        body: payload,
      });
    } catch (fetchError) {
      console.error(`[${module} Approval API ${action}] Fetch error:`, fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to connect to backend API',
          error: fetchError instanceof Error ? fetchError.message : 'Network error',
        },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    let data: unknown = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText || `Failed to ${action} request` };
    }

    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `Failed to ${action} request`;

      return NextResponse.json(
        { success: false, message, error: data },
        { status: response.status }
      );
    }

    return NextResponse.json(
      typeof data === 'object' && data !== null ? data : { success: true },
      { status: response.status }
    );
  } catch (error) {
    console.error(`[${module} Approval API ${action}] Error:`, error);
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
