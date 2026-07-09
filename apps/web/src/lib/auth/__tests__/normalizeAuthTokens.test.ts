import {
  extractAuthTokensFromApiResponse,
  normalizeAuthTokens,
  unwrapAuthPayload,
} from '@/lib/auth/normalizeAuthTokens';

describe('normalizeAuthTokens', () => {
  it('maps snake_case login response tokens', () => {
    const tokens = normalizeAuthTokens({
      access_token: 'access-abc',
      refresh_token: 'refresh-xyz',
      expires_at: 1783230670,
    });

    expect(tokens).toEqual({
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
      expiresAt: 1783230670,
    });
  });

  it('unwraps nested data from backend login envelope', () => {
    const tokens = extractAuthTokensFromApiResponse({
      success: true,
      message: 'Login successful',
      data: {
        access_token: 'nested-access',
        refresh_token: 'nested-refresh',
        expires_at: 1783230670,
      },
    });

    expect(tokens?.accessToken).toBe('nested-access');
    expect(tokens?.refreshToken).toBe('nested-refresh');
  });

  it('supports camelCase token fields', () => {
    expect(
      normalizeAuthTokens({
        accessToken: 'a',
        refreshToken: 'r',
        expiresAt: 123,
      })
    ).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: 123,
    });
  });

  it('returns null when access token is missing', () => {
    expect(unwrapAuthPayload({ refresh_token: 'only-refresh' })).toEqual({
      refresh_token: 'only-refresh',
    });
    expect(normalizeAuthTokens({ refresh_token: 'only-refresh' })).toBeNull();
  });
});
