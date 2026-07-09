import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().trim().min(1, 'Mobile is required'),
  roleId: z.number().int().positive('Role is required'),
  branchIds: z.array(z.number().int().positive()).min(1, 'Select at least one branch'),
});

// On edit, password is optional; an empty string means "leave unchanged".
export const updateUserSchema = createUserSchema.partial().extend({
  password: z.union([z.string().min(6, 'Password must be at least 6 characters'), z.literal('')]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
