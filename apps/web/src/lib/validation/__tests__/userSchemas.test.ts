import { createUserSchema, updateUserSchema } from '../userSchemas';

describe('createUserSchema', () => {
  it('accepts a valid create payload', () => {
    const result = createUserSchema.safeParse({
      name: 'Alice', email: 'alice@example.com', password: 'secret123',
      mobile: '+1234567890', roleId: 1, branchIds: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty branchIds and bad email', () => {
    const result = createUserSchema.safeParse({
      name: 'Alice', email: 'nope', password: 'secret123',
      mobile: '+1', roleId: 1, branchIds: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('allows an empty password (treated as "unchanged")', () => {
    const result = updateUserSchema.safeParse({ name: 'Alice', password: '' });
    expect(result.success).toBe(true);
  });
});
