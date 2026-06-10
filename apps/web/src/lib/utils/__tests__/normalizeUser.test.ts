import { normalizeUser } from '../normalizeUser';

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
});
