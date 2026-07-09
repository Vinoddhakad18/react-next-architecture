import { normalizeMenu, withListPermissions } from '@/services/menu.service';
import { decryptApiResponse } from '@/lib/api/customEncryptClient';
import { extractPagePermissions } from '@/lib/api/permissions';

const SAMPLE_MENU_LIST_RESPONSE_DATA =
  '0m0q0n0q0p0t1z0Y1l1d1r1r1Z1f1d0Y0w0Y1F1d1m1t1r0W1q1d1s1q1h1d1u1d1c0W1r1t1b1b1d1r1r1e1t1k1k1x0Y0i0Y1c1Z1s1Z0Y0w1z0Y1c1Z1s1Z0Y0w1T1z0Y1h1c0Y0w0o0i0Y1m1Z1l1d0Y0w0Y1F1d1m1t0W1F1Z1m1Z1f1d1l1d1m1s0Y0i0Y1q1n1t1s1d0Y0w0Y0l1Z1c1l1h1m0l1l1d1m1t1r0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w0n0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0n0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d210i0Y1o1Z1q1d1m1s0Y0w1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y21210i1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w1m1t1k1k0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0n0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d21210i1z0Y1h1c0Y0w0p0i0Y1m1Z1l1d0Y0w0Y1K1n1k1d0W1F1Z1m1Z1f1d1l1d1m1s0Y0i0Y1q1n1t1s1d0Y0w0Y0l1Z1c1l1h1m0l1q1n1k1d1r0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w0n0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0o0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d210i0Y1o1Z1q1d1m1s0Y0w1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y21210i1z0Y1h1c0Y0w0r0i0Y1m1Z1l1d0Y0w0Y141q1Z1m1b1g0W1F1Z1m1Z1f1d1l1d1m1s0Y0i0Y1q1n1t1s1d0Y0w0Y0l1Z1c1l1h1m0l1a1q1Z1m1b1g1d1r0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w0n0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0p0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d210i0Y1o1Z1q1d1m1s0Y0w1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y21210i1z0Y1h1c0Y0w0q0i0Y1m1Z1l1d0Y0w0Y1K1413150W1I1d1q1l1h1r1r1h1n1m0Y0i0Y1q1n1t1s1d0Y0w0Y0l1Z1c1l1h1m0l1q1a1Z1b0j1o1d1q1l1h1r1r1h1n1m1r0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w0n0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0q0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d210i0Y1o1Z1q1d1m1s0Y0w1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y21210i1z0Y1h1c0Y0w0s0i0Y1m1Z1l1d0Y0w0Y1N1r1d1q0W1F1Z1m1Z1f1d1l1d1m1s0Y0i0Y1q1n1t1s1d0Y0w0Y0l1Z1c1l1h1m0l1t1r1d1q1r0Y0i0Y1o1Z1q1d1m1s1X1h1c0Y0w0n0i0Y1h1b1n1m0Y0w1m1t1k1k0i0Y1r1n1q1s1X1n1q1c1d1q0Y0w0r0i0Y1h1r1X1Z1b1s1h1u1d0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1z0Y1g1Z1r1X1o1d1m1c1h1m1f0Y0w1e1Z1k1r1d210i0Y1o1Z1q1d1m1s0Y0w1z0Y1h1c0Y0w0n0i0Y1m1Z1l1d0Y0w0Y131c1l1h1m0W1I1Z1m1d1k0Y0i0Y1q1n1t1s1d0Y0w0Y0l0Z0Y21211V0i0Y1o1d1m1c1h1m1f1X1b1q1d1Z1s1d1r0Y0w1T1V0i0Y1o1Z1f1h1m1Z1s1h1n1m0Y0w1z0Y1o1Z1f1d0Y0w0n0i0Y1o1d1q1X1o1Z1f1d0Y0w0n0m0i0Y1s1n1s1Z1k1X1q1d1b1n1q1c1r0Y0w0s0i0Y1s1n1s1Z1k1X1o1Z1f1d1r0Y0w0n21210i0Y1o1d1q1l1h1r1r1h1n1m1r0Y0w1z0Y1l1d1m1t0Y0w0Y0l1Z1c1l1h1m0l1l1d1m1t1r0Y0i0Y1u1h1d1v0Y0w1s1q1t1d0i0Y1Z1c1c0Y0w1s1q1t1d0i0Y1d1c1h1s0Y0w1s1q1t1d0i0Y1c1d1k1d1s1d0Y0w1s1q1t1d0i0Y1d1w1o1n1q1s0Y0w1s1q1t1d0i0Y1r1s1Z1s1t1r0Y0w1s1q1t1d0i0Y1Z1o1o1q1n1u1Z1k0Y0w1s1q1t1d21211a1r0o0r0r1M';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeMenuListPayload(payload: unknown, page = 1, limit = 10) {
  let backendData: unknown = payload;

  if (isRecord(payload) && isRecord(payload.data)) {
    backendData = payload.data;
  }

  const menuItems = isRecord(backendData)
    ? (backendData.data ?? backendData.menus ?? [])
    : backendData;

  const normalizedMenus = (Array.isArray(menuItems) ? menuItems : []).map((menu) =>
    normalizeMenu(menu as Record<string, unknown>)
  );

  const paginationSource = isRecord(backendData) ? backendData.pagination ?? backendData.meta : null;
  const pagination = isRecord(paginationSource)
    ? paginationSource
    : { total: normalizedMenus.length, page, limit, totalPages: 1 };

  const permissions = isRecord(payload) ? extractPagePermissions(payload) : undefined;

  return withListPermissions(
    {
      data: normalizedMenus,
      meta: {
        total: Number(pagination.total_records ?? pagination.total ?? normalizedMenus.length),
        page: Number(pagination.page ?? page),
        limit: Number(pagination.per_page ?? pagination.limit ?? limit),
        totalPages: Number(pagination.total_pages ?? pagination.totalPages ?? 1),
      },
    },
    permissions
  );
}

describe('menu list pipeline', () => {
  it('normalizes decrypted encrypted menu list for the admin page', () => {
    const decrypted = decryptApiResponse({
      success: true,
      message: 'Menus retrieved successfully',
      response_data: SAMPLE_MENU_LIST_RESPONSE_DATA,
    });

    const unwrapped =
      decrypted.permissions !== undefined
        ? { data: decrypted.data, permissions: decrypted.permissions }
        : decrypted.data;

    const list = normalizeMenuListPayload(unwrapped, 1, 10);

    expect(list.data).toHaveLength(6);
    expect(list.data[0]?.name).toBe('Menu Management');
    expect(list.meta).toEqual({
      total: 6,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(list.permissions?.view).toBe(true);
  });
});
