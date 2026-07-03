import { normalizeApprovalObject } from '@/lib/approval/entityApproval';

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
});
