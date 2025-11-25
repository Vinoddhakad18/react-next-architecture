/**
 * API Client Tests
 */

import { apiClient } from '../api/client';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should make a GET request', async () => {
    const mockResponse = { success: true, data: { message: 'Success' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.success).toBe(true);
  });

  it('should make a POST request with data', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    const postData = { name: 'Test' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.post('/test', postData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    );
    expect(result.success).toBe(true);
  });

  it('should handle errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await apiClient.get('/test');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
