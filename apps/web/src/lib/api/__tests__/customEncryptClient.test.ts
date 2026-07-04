import {
  buildEncryptedLoginBody,
  decryptAuthResponse,
  unwrapAuthApiResponse,
} from '../customEncryptClient';

const SAMPLE_RESPONSE_DATA =
  '0m0q0m0s0u0o1z0Y1l1d1r1r1Z1f1d0Y0w0Y1E1n1f1h1m0W1r1t1b1b1d1r1r1e1t1k0Y0i0Y1c1Z1s1Z0Y0w1z0Y1Z1b1b1d1r1r1X1s1n1j1d1m0Y0w0Y1d1x1C1g1a191b1h1H1h1C1B1N1y1B0n1G1h1B1r1B1m1K0r1b151B0s1B1j1o1Q1O151C0v0k1d1x1C0n1b0o1O1x1L1P1J1h1H1i171r1B1l1O1s1R1P1k1r1B1i1n1h1R1P1K1s1Z1P0r131S1Q1g1g1a1Q141r1S1L0r1i1a0o0m1h1E151C1x1a0o1w1k1B1i1n1h1b0p1O1v1S1Q1C1e1R1P1K1s1Z1P0q1h1E151C1o1R1Q1J1h1H1i170p1H161F1w1H161j1v1G1M1J1r1B1l1O0q1b151B0s1F1M1b0q1F1y1B0p1H1M130n1G151v1h1R1Q1O1j1B1i1n1h1a1l0v1j1S1L0n1g1b1l1G1n1Z1Q1K1k1R0p1K0n1b1l1N1s1c1Q1G1k1b1m1F1h1E151C1o1b0p1F1h1H1h1C1t1a0o1K1k1E1P181x1R0o1g1o1c191O1i1c1A1O1x1S1L0n1g1b1A131h1e1J0k17141R1M1D1G1G0s1B1f1r1b1o1m0t1w1b1w0r1w1l1o1i1u1d1o1I1w1I1j151o1X191e0j0t1v0t191c1i1v0Y0i0Y1q1d1e1q1d1r1g1X1s1n1j1d1m0Y0w0Y1d1x1C1g1a191b1h1H1h1C1B1N1y1B0n1G1h1B1r1B1m1K0r1b151B0s1B1j1o1Q1O151C0v0k1d1x1C0n1b0o1O1x1L1P1J1h1H1i171r1B1l1O1s1R1P1k1r1B1i1n1h1R1P1K1s1Z1P0r131S1Q1g1g1a1Q141r1S1L0r1i1a0o0m1h1E151C1x1a0o1w1k1B1i1n1h1b0p1O1v1S1Q1C1e1R1P1K1s1Z1P0q1h1E151C1o1R1Q1J1h1H1i170p1H161F1w1H161j1v1G1M1J1r1B1l1O0q1b151B0s1F1M1b0q1F1y1b0r1F1y1f0n1G151v1h1R1Q1O1j1B1i1n1h1a1l0v1j1S1L0n1g1b1l1G1n1Z1Q1K1k1R0p1K0n1b1l1N1s1c1Q1G1k1b1m1F1h1E151C1o1b0p1F1h1H1h1C1t1a0o1K1k1E1P181x1R0o1g1o1c191O1i1c1A1O1x1S1L0n1g1b1A131h1e1J0k1m0r0v1P1h1g1L1p131c171w1H1g0t1G1S0t1A1r161o0n151c1M1u1d1m0s1i0v191l1e1a1x0t1q1H0s181b0Y0i0Y1d1w1o1h1q1d1r1X1Z1s0Y0w0n0t0u0p0o0t0v0m0r0q21211a1r0o0r0r1M';

describe('buildEncryptedLoginBody', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENCRYPT_DECRYPT_KEY =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENCRYPT_DECRYPT_KEY;
  });

  it('wraps credentials in request_data', () => {
    const body = buildEncryptedLoginBody({
      email: 'admin@example.com',
      password: 'password123',
    });

    expect(body).toHaveProperty('request_data');
    expect(typeof body.request_data).toBe('string');
  });
});

describe('decryptAuthResponse', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENCRYPT_DECRYPT_KEY =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENCRYPT_DECRYPT_KEY;
  });

  it('decrypts backend login success response_data', () => {
    const result = decryptAuthResponse({
      success: true,
      message: 'Login successful',
      response_data: SAMPLE_RESPONSE_DATA,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.data).toEqual(
      expect.objectContaining({
        access_token: expect.stringContaining('eyJ'),
        refresh_token: expect.stringContaining('eyJ'),
        expires_at: expect.any(Number),
      })
    );
  });

  it('unwrapAuthApiResponse handles encrypted and plain payloads', () => {
    const encrypted = unwrapAuthApiResponse({
      success: true,
      message: 'Login successful',
      response_data: SAMPLE_RESPONSE_DATA,
    });
    expect(encrypted.data).toEqual(
      expect.objectContaining({ access_token: expect.any(String) })
    );

    const plain = unwrapAuthApiResponse({
      success: true,
      message: 'Login successful',
      data: { accessToken: 'token-abc' },
    });
    expect(plain.data).toEqual({ accessToken: 'token-abc' });
  });
});
