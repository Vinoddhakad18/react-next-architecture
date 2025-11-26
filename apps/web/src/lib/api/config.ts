/**
 * API Configuration
 * Central configuration for all API-related settings
 */

import { tokenManager } from '@/lib/auth/TokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
  },
} as const;

export const getAuthHeader = (): Record<string, string> => {
  return tokenManager.getAuthHeader();
};

export const getApiKeyHeader = (): Record<string, string> => {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
};
