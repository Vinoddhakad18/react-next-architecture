import {
  normalizeApprovalObject,
  getEntityApprovalDisplay,
  canReviewApproval,
  getApprovalReviewButtonTitle,
} from '@/lib/approval/entityApproval';

describe('normalizeApprovalObject snake_case', () => {
  it('maps snake_case approval fields from backend responses', () => {
    const approval = normalizeApprovalObject({
      has_pending: true,
      request_id: 5,
      request_no: 'APR-2026-000005',
      action: 'UPDATE',
      status: 'PENDING',
      maker_id: 2,
      maker_name: 'Checker User',
      maker_email: 'checker@example.com',
      submitted_at: '2026-07-03T10:00:00.000Z',
      changed_fields: ['name', 'status'],
      proposed_data: { name: 'New Name', status: 'ACTIVE' },
      previous_data: { name: 'Old Name', status: 'INACTIVE' },
    });

    expect(approval).toMatchObject({
      hasPending: true,
      requestId: 5,
      requestNo: 'APR-2026-000005',
      action: 'UPDATE',
      status: 'PENDING',
      makerId: 2,
      makerName: 'Checker User',
      makerEmail: 'checker@example.com',
      submittedAt: '2026-07-03T10:00:00.000Z',
      changedFields: ['name', 'status'],
      proposedData: { name: 'New Name', status: 'ACTIVE' },
      previousData: { name: 'Old Name', status: 'INACTIVE' },
    });
  });

  it('treats status PENDING as pending when has_pending is absent', () => {
    const approval = normalizeApprovalObject({
      status: 'PENDING',
      request_id: 1,
    });

    expect(approval?.hasPending).toBe(true);
    expect(approval?.requestId).toBe(1);
  });

  it('maps rejected approval fields from snake_case backend responses', () => {
    const approval = normalizeApprovalObject({
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
        email: 'admin@example.com',
        action: 'rejected',
        acted_at: '2026-07-09T07:30:22.895Z',
        comment: 'can not change',
      },
    });

    expect(approval).toMatchObject({
      hasPending: false,
      hasRejected: true,
      requestId: 19,
      requestNo: 'APR-2026-000019',
      rejectionReason: 'can not change',
      actionBy: {
        userId: 1,
        name: 'Super User',
        email: 'admin@example.com',
        action: 'rejected',
        comment: 'can not change',
      },
    });
  });
});

describe('entity approval display helpers', () => {
  it('returns rejected display copy', () => {
    expect(
      getEntityApprovalDisplay({
        hasPending: false,
        hasRejected: true,
        requestNo: 'APR-2026-000019',
        action: 'UPDATE',
      })
    ).toEqual({
      title: 'Update rejected',
      subtitle: 'APR-2026-000019',
      tone: 'rejected',
    });
  });

  it('detects reviewable pending and rejected approvals', () => {
    expect(canReviewApproval({ hasPending: true, hasRejected: false })).toBe(true);
    expect(canReviewApproval({ hasPending: false, hasRejected: true })).toBe(true);
    expect(canReviewApproval({ hasPending: false, hasRejected: false })).toBe(false);
  });

  it('returns review button titles for pending and rejected rows', () => {
    expect(getApprovalReviewButtonTitle({ hasPending: true })).toBe('View requested changes');
    expect(getApprovalReviewButtonTitle({ hasRejected: true })).toBe('View rejection details');
    expect(getApprovalReviewButtonTitle({ hasPending: false, hasRejected: false })).toBeUndefined();
  });
});
