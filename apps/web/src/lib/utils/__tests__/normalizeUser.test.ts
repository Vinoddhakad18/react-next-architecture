import { normalizeAccountStatus, normalizeUser } from '../normalizeUser';

describe('normalizeUser', () => {
  it('maps snake_case backend fields to the frontend User shape', () => {
    const result = normalizeUser({
      id: 7,
      full_name: 'Alice Smith',
      email: 'alice@example.com',
      mobile: '+1234567890',
      role_id: 1,
      role: 'admin',
      branch_ids: [1, 2, 3],
      is_active: true,
    });

    expect(result).toMatchObject({
      id: '7',
      name: 'Alice Smith',
      email: 'alice@example.com',
      mobile: '+1234567890',
      roleId: 1,
      role: 'admin',
      branchIds: [1, 2, 3],
      status: 'active',
    });
  });

  it('derives status from isActive=false and tolerates missing fields', () => {
    const result = normalizeUser({ id: 1, isActive: false });
    expect(result.status).toBe('inactive');
    expect(result.branchIds).toEqual([]);
  });

  it('derives status from numeric is_active flag', () => {
    expect(normalizeUser({ id: 1, is_active: 1 }).status).toBe('active');
    expect(normalizeUser({ id: 1, is_active: 0 }).status).toBe('inactive');
  });

  it('normalizes uppercase ACTIVE status', () => {
    expect(normalizeUser({ id: 1, status: 'ACTIVE' }).status).toBe('active');
    expect(normalizeUser({ id: 1, status: 'INACTIVE' }).status).toBe('inactive');
  });

  it('normalizeAccountStatus maps common values', () => {
    expect(normalizeAccountStatus('ACTIVE')).toBe('active');
    expect(normalizeAccountStatus('inactive')).toBe('inactive');
    expect(normalizeAccountStatus(true)).toBe('active');
  });

  it('maps snake_case nested approval fields', () => {
    const result = normalizeUser({
      id: 2,
      full_name: 'Test User',
      email: 'test@example.com',
      approval: {
        has_pending: true,
        request_id: 7,
        request_no: 'APR-2026-000007',
        previous_data: { branch_ids: [1, 2] },
      },
    });

    expect(result.approval?.hasPending).toBe(true);
    expect(result.approval?.requestId).toBe(7);
    expect(result.approval?.requestNo).toBe('APR-2026-000007');
    expect(result.approvalStatus).toBe('pending');
  });

  it('maps rejected approval fields from snake_case backend payload', () => {
    const result = normalizeUser({
      id: 41,
      name: 'Lokesh Dhakad',
      email: 'lokesh@example.com',
      approval: {
        has_pending: false,
        has_rejected: true,
        request_id: 19,
        request_no: 'APR-2026-000019',
        action: 'UPDATE',
        status: 'REJECTED',
        rejection_reason: 'can not change',
        action_by: {
          user_id: 1,
          name: 'Super User',
          comment: 'can not change',
          acted_at: '2026-07-09T07:30:22.895Z',
        },
      },
    });

    expect(result.approval?.hasRejected).toBe(true);
    expect(result.approval?.rejectionReason).toBe('can not change');
    expect(result.approval?.actionBy?.name).toBe('Super User');
    expect(result.approvalStatus).toBe('rejected');
  });
});
