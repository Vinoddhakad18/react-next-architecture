import { userService } from '../user.service';
import { encryptedPost } from '@/lib/api/encryptedClientApi';

jest.mock('@/lib/api/encryptedClientApi', () => ({
  encryptedPost: jest.fn(),
  encryptedGet: jest.fn(),
  encryptedPut: jest.fn(),
  encryptedPatch: jest.fn(),
  encryptedDelete: jest.fn(),
}));

describe('userService.createUser', () => {
  afterEach(() => jest.resetAllMocks());

  it('POSTs snake_case payload via encryptedPost', async () => {
    (encryptedPost as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Alice Smith', email: 'alice@example.com', status: 'active' },
      error: null,
    });

    const payload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'secret123',
      mobile: '+1234567890',
      roleId: 1,
      branchIds: [1, 2, 3],
    };

    await userService.createUser(payload);

    expect(encryptedPost).toHaveBeenCalledWith('/api/v1/users', {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'secret123',
      mobile: '+1234567890',
      role_id: 1,
      branch_ids: [1, 2, 3],
    });
  });
});
