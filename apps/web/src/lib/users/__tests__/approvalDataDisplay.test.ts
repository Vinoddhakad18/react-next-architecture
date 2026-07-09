import { buildApprovalDataRows } from '../approvalDataDisplay';

const samplePrevious = {
  name: 'Manager User',
  email: 'manager@example.com',
  mobile: '+0987654321',
  roleId: 2,
  status: 'ACTIVE',
  branchId: 1,
  branchIds: [],
  roleName: 'Manager',
  branchName: 'Global Headquarters',
};

const sampleProposed = {
  name: 'Manager User Tes',
  email: 'manager@example.com',
  roleId: 2,
  roleName: 'Manager',
};

describe('buildApprovalDataRows', () => {
  it('builds readable rows from previousData and proposedData', () => {
    const rows = buildApprovalDataRows(samplePrevious, sampleProposed, [
      'name',
      'mobile',
      'branchIds',
      'branchId',
      'status',
    ]);

    const nameRow = rows.find((r) => r.key === 'name');
    expect(nameRow).toEqual({
      key: 'name',
      label: 'Name',
      current: 'Manager User',
      requested: 'Manager User Tes',
      changed: true,
    });

    const mobileRow = rows.find((r) => r.key === 'mobile');
    expect(mobileRow?.current).toBe('+0987654321');
    expect(mobileRow?.requested).toBe('—');
    expect(mobileRow?.changed).toBe(true);

    const branchRow = rows.find((r) => r.key === 'branchName');
    expect(branchRow?.current).toBe('Global Headquarters');
    expect(branchRow?.requested).toBe('—');
  });

  it('formats status and empty branch lists', () => {
    const rows = buildApprovalDataRows(samplePrevious, {}, ['status']);
    const statusRow = rows.find((r) => r.key === 'status');
    expect(statusRow?.current).toBe('Active');

    const branchesRow = rows.find((r) => r.key === 'branchIds');
    expect(branchesRow?.current).toBe('None');
  });
});
