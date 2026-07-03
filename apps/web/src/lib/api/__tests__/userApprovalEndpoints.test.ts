import { API_ENDPOINTS } from '../endpoints';

describe('user approval endpoints', () => {
  it('uses users/approvals/{requestId}/approve path', () => {
    expect(API_ENDPOINTS.USERS.APPROVAL_APPROVE(2)).toBe('/api/v1/users/approvals/2/approve');
  });

  it('uses users/approvals/{requestId}/reject path', () => {
    expect(API_ENDPOINTS.USERS.APPROVAL_REJECT(2)).toBe('/api/v1/users/approvals/2/reject');
  });
});
