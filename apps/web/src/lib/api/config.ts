/**
 * API Configuration
 * Central configuration for all API-related settings
 */

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
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
