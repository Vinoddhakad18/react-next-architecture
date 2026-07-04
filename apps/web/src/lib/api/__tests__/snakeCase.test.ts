import { describe, expect, it } from 'vitest';
import { toSnakeCaseKeys } from '../snakeCase';

describe('toSnakeCaseKeys', () => {
  it('converts camelCase keys to snake_case', () => {
    expect(
      toSnakeCaseKeys({
        name: 'John',
        roleId: 2,
        branchIds: [1, 2],
      })
    ).toEqual({
      name: 'John',
      role_id: 2,
      branch_ids: [1, 2],
    });
  });

  it('leaves already snake_case keys unchanged', () => {
    expect(
      toSnakeCaseKeys({
        branch_name: 'HQ',
        is_active: true,
      })
    ).toEqual({
      branch_name: 'HQ',
      is_active: true,
    });
  });

  it('converts nested objects recursively', () => {
    expect(
      toSnakeCaseKeys({
        roleId: 1,
        approval: { hasPending: true, requestId: 5 },
      })
    ).toEqual({
      role_id: 1,
      approval: { has_pending: true, request_id: 5 },
    });
  });
});
