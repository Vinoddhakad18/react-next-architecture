import {
  resolveApprovalStatus,
  needsApprovalAction,
  getApprovalStatusLabel,
} from '../approval';

describe('resolveApprovalStatus', () => {
  it('maps explicit pending values', () => {
    expect(resolveApprovalStatus('pending')).toBe('pending');
    expect(resolveApprovalStatus('pending_approval')).toBe('pending');
  });

  it('maps explicit rejected values', () => {
    expect(resolveApprovalStatus('rejected')).toBe('rejected');
  });

  it('maps explicit approved values', () => {
    expect(resolveApprovalStatus('approved')).toBe('approved');
    expect(resolveApprovalStatus('active')).toBe('approved');
  });

  it('falls back to secondary status field', () => {
    expect(resolveApprovalStatus(undefined, 'pending')).toBe('pending');
    expect(resolveApprovalStatus(undefined, 'active')).toBe('approved');
  });

  it('treats missing approval and status as pending', () => {
    expect(resolveApprovalStatus(undefined, '')).toBe('pending');
    expect(resolveApprovalStatus(undefined, undefined)).toBe('pending');
  });

  it('honours isApproved boolean flags', () => {
    expect(resolveApprovalStatus(undefined, 'active', { isApproved: false })).toBe('pending');
    expect(resolveApprovalStatus(undefined, '', { isApproved: true })).toBe('approved');
  });

  it('defaults unknown explicit tokens to approved', () => {
    expect(resolveApprovalStatus('custom_value', 'unknown')).toBe('approved');
  });
});

describe('needsApprovalAction', () => {
  it('returns true for pending, draft, and rejected', () => {
    expect(needsApprovalAction('pending')).toBe(true);
    expect(needsApprovalAction('draft')).toBe(true);
    expect(needsApprovalAction('rejected')).toBe(true);
    expect(needsApprovalAction('approved')).toBe(false);
  });
});

describe('getApprovalStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(getApprovalStatusLabel('pending')).toBe('Pending Approval');
    expect(getApprovalStatusLabel('approved')).toBe('Approved');
  });
});
