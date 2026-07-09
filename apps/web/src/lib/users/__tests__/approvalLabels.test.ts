import {
  formatApprovalAction,
  formatUserStatus,
  getUserApprovalDisplay,
} from '../approvalLabels';

describe('approvalLabels', () => {
  it('formats approval action codes', () => {
    expect(formatApprovalAction('UPDATE')).toBe('Update');
    expect(formatApprovalAction('CREATE')).toBe('New user');
    expect(formatApprovalAction('DELETE')).toBe('Delete');
  });

  it('returns compact pending copy without redundant labels', () => {
    expect(
      getUserApprovalDisplay({
        hasPending: true,
        requestNo: 'APR-2026-000002',
        action: 'UPDATE',
      })
    ).toEqual({
      title: 'Update pending',
      subtitle: 'APR-2026-000002',
      tone: 'pending',
    });
  });

  it('returns approved copy when nothing is pending', () => {
    expect(getUserApprovalDisplay({ hasPending: false })).toEqual({
      title: 'Approved',
      tone: 'approved',
    });
  });

  it('returns rejected copy when approval was rejected', () => {
    expect(
      getUserApprovalDisplay({
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

  it('formats user status for display', () => {
    expect(formatUserStatus('ACTIVE')).toBe('Active');
    expect(formatUserStatus('')).toBe('—');
  });
});
