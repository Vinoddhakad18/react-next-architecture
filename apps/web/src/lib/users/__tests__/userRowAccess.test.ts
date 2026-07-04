import {
  getUserRowActionAccess,
  getUserRoleName,
  isUserStatusActive,
  isSuperAdminRole,
} from '../userRowAccess';
import type { User } from '@/types/api/user';

const baseUser: User = {
  id: '1',
  name: 'Test',
  email: 'test@example.com',
  role: 'Manager',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

describe('userRowAccess', () => {
  it('detects super_admin role variants', () => {
    expect(isSuperAdminRole('super_admin')).toBe(true);
    expect(isSuperAdminRole('Super Admin')).toBe(true);
    expect(isSuperAdminRole('Manager')).toBe(false);
  });

  it('hides all actions on super_admin rows for non-super_admin viewers', () => {
    const user = { ...baseUser, roleName: 'super_admin' };
    expect(getUserRowActionAccess(user, false)).toEqual({
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canToggleStatus: false,
    });
  });

  it('allows permission-gated actions on super_admin rows for super_admin viewers', () => {
    const user = { ...baseUser, roleName: 'super_admin' };
    expect(getUserRowActionAccess(user, true)).toEqual({
      canEdit: true,
      canDelete: false,
      canApprove: true,
      canToggleStatus: true,
    });
  });

  it('allows actions on non-super_admin rows for any viewer', () => {
    expect(getUserRowActionAccess(baseUser, false)).toEqual({
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canToggleStatus: true,
    });
  });

  it('prefers roleName over role', () => {
    expect(getUserRoleName({ ...baseUser, roleName: 'super_admin', role: 'Manager' })).toBe(
      'super_admin'
    );
  });

  it('normalizes active status values', () => {
    expect(isUserStatusActive('ACTIVE')).toBe(true);
    expect(isUserStatusActive('active')).toBe(true);
    expect(isUserStatusActive('inactive')).toBe(false);
  });
});
