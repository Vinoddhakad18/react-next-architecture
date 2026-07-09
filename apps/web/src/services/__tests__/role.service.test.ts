import { normalizeRoleListPayload } from '@/services/role.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

describe('normalizeRoleListPayload via role service shapes', () => {
  const sampleRole = {
    id: 1,
    name: 'Admin',
    description: 'Administrator',
    is_active: true,
  };

  it('extracts roles when data is a direct array', () => {
    const result = normalizeRoleListPayload([sampleRole], 1, 10);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Admin');
  });

  it('extracts roles from nested data.data with pagination', () => {
    const result = normalizeRoleListPayload(
      {
        data: {
          data: [sampleRole],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        },
        permissions: { view: true },
      },
      1,
      10
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.permissions?.view).toBe(true);
  });

  it('extracts roles when data field is the role array', () => {
    const result = normalizeRoleListPayload(
      {
        data: [sampleRole],
        pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
      },
      1,
      10
    );
    expect(result.data).toHaveLength(1);
  });

  it('extracts roles from encrypted unwrap shape with permissions wrapper', () => {
    const result = normalizeRoleListPayload(
      {
        data: {
          data: [sampleRole],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        },
        permissions: { view: true, add: true },
      },
      1,
      10
    );
    expect(result.data).toHaveLength(1);
    expect(result.permissions?.add).toBe(true);
  });
});
