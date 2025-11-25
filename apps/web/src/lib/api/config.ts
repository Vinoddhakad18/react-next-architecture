/**
 * API Configuration
 * Central configuration for all API-related settings
 */

import { tokenManager } from '@/lib/auth/TokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

export const getAuthHeader = (): Record<string, string> => {
  return tokenManager.getAuthHeader();
};
