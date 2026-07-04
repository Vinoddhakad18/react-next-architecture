/**
 * API Configuration
 * Central configuration for all API-related settings
 */

import { tokenManager } from '@/lib/auth/TokenManager';

// Empty string = same-origin BFF (/api/...). Only set NEXT_PUBLIC_API_URL when
// intentionally calling the backend directly (not recommended).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
export const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': API_KEY ? API_KEY : undefined,
  },
} as const;

export const getAuthHeader = (): Record<string, string> => {
  return tokenManager.getAuthHeader();
};

export const getApiKeyHeader = (): Record<string, string> => {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
};
