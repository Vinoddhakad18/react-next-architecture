import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Application
  PORT: z.string().default('4200'),

  // Next.js public variables
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4200'),

  // Authentication (required for production)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Database (optional, uncomment when needed)
  // DATABASE_URL: z.string().url(),
  // POSTGRES_USER: z.string().optional(),
  // POSTGRES_PASSWORD: z.string().optional(),
  // POSTGRES_DB: z.string().optional(),
});

/**
 * Validated and typed environment variables
 * Import this instead of using process.env directly
 */
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  JWT_SECRET: process.env.JWT_SECRET,
});

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
