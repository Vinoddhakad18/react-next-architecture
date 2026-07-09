import { parseUserListResponse } from '../parseUserListResponse';
import { normalizeUser, resolveUserApprovalStatus } from '@/lib/utils/normalizeUser';

const sampleApiResponse = {
  success: true,
  message: 'Users retrieved successfully',
  data: {
    data: [
      {
        id: 2,
        name: 'Manager User MP',
        email: 'manager@example.com',
        roleId: 2,
        roleName: 'Manager',
        branchId: 1,
        branchName: 'Global Headquarters',
        branches: [],
        approval: {
          hasPending: true,
          requestId: 2,
          requestNo: 'APR-2026-000002',
          action: 'UPDATE',
          status: 'PENDING',
          makerId: 2,
          makerName: 'Manager User MP',
          makerEmail: 'manager@example.com',
          submittedAt: '2026-07-03T05:33:07.818Z',
          changedFields: ['name', 'mobile', 'branchIds', 'branchId', 'status'],
          proposedData: { name: 'Manager User', email: 'manager@example.com', roleId: 2 },
          previousData: {
            name: 'Manager User MP',
            email: 'manager@example.com',
            mobile: '+0987654321',
            roleId: 2,
            status: 'ACTIVE',
            branchId: 1,
            branchIds: [],
          },
        },
      },
      {
        id: 1,
        name: 'Super User',
        email: 'admin@example.com',
        roleId: 1,
        roleName: 'super_admin',
        branchId: 1,
        branchName: 'Global Headquarters',
        branches: [],
        approval: { hasPending: false },
      },
    ],
    pendingCreates: [],
    pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
  },
  permissions: {
    menu: '/admin/users',
    view: true,
    add: true,
    edit: true,
    delete: true,
    export: true,
    status: true,
    approval: true,
  },
};

describe('parseUserListResponse', () => {
  it('parses the backend users list shape with nested approval and permissions', () => {
    const result = parseUserListResponse(sampleApiResponse);

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.permissions?.approval).toBe(true);
    expect(result.permissions?.menu).toBe('/admin/users');

    const pendingUser = result.data[0];
    expect(pendingUser.approval?.hasPending).toBe(true);
    expect(pendingUser.approval?.requestId).toBe(2);
    expect(pendingUser.approval?.requestNo).toBe('APR-2026-000002');
    expect(pendingUser.approvalStatus).toBe('pending');
    expect(pendingUser.status).toBe('active');

    const approvedUser = result.data[1];
    expect(approvedUser.approval?.hasPending).toBe(false);
    expect(approvedUser.approvalStatus).toBe('approved');
  });
});

describe('normalizeUser approval mapping', () => {
  it('marks hasPending approval as pending status', () => {
    const user = normalizeUser(sampleApiResponse.data.data[0] as Record<string, unknown>);
    expect(resolveUserApprovalStatus(user.approval)).toBe('pending');
  });

  it('marks hasPending false as approved', () => {
    const user = normalizeUser(sampleApiResponse.data.data[1] as Record<string, unknown>);
    expect(resolveUserApprovalStatus(user.approval)).toBe('approved');
  });

  it('parses snake_case approval and pending_creates from backend responses', () => {
    const result = parseUserListResponse({
      success: true,
      data: {
        data: [
          {
            id: 3,
            full_name: 'Pending User',
            email: 'pending@example.com',
            role_id: 2,
            role_name: 'Manager',
            approval: {
              has_pending: true,
              request_id: 9,
              request_no: 'APR-2026-000009',
              action: 'UPDATE',
              status: 'PENDING',
              proposed_data: { name: 'Pending User Updated' },
              previous_data: { name: 'Pending User' },
            },
          },
        ],
        pending_creates: [
          {
            id: 0,
            full_name: 'Draft User',
            email: 'draft@example.com',
            is_pending_create: true,
            approval: { has_pending: true, request_id: 10, status: 'PENDING' },
          },
        ],
        pagination: { total: 2, page: 1, limit: 10, total_pages: 1 },
      },
      permissions: { menu: '/admin/users', view: true, approval: 1 },
    });

    expect(result.data[0].approval?.requestId).toBe(9);
    expect(result.data[0].approval?.requestNo).toBe('APR-2026-000009');
    expect(result.pendingCreates).toHaveLength(1);
    expect(result.pendingCreates?.[0].isPendingCreate).toBe(true);
    expect(result.pendingCreates?.[0].approval?.requestId).toBe(10);
  });
});
