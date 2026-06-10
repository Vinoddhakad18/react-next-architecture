import { userService } from '../user.service';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
  API_ENDPOINTS: {
    USERS: {
      LIST: '/api/v1/users',
      CREATE: '/api/v1/users',
      UPDATE: (id: string) => `/api/v1/users/${id}`,
      DELETE: (id: string) => `/api/v1/users/${id}`,
    },
  },
}));

describe('userService.createUser', () => {
  afterEach(() => jest.resetAllMocks());

  it('POSTs the create payload to the users endpoint with auth', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ success: true, data: { id: '1' }, error: null });

    const payload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'secret123',
      mobile: '+1234567890',
      roleId: 1,
      branchIds: [1, 2, 3],
    };

    await userService.createUser(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users', payload, { auth: true });
  });
});
