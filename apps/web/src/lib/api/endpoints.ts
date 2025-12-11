/**
 * API Endpoints
 * Centralized endpoint definitions for all API routes
 */

export const API_ENDPOINTS = {
  // CSRF Protection
  CSRF: '/api/csrf',

  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh-token',
    ME: '/api/v1/auth/me',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },

  // Users
  USERS: {
    LIST: '/api/v1/users',
    GET: (id: string) => `/api/v1/users/${id}`,
    CREATE: '/api/v1/users',
    UPDATE: (id: string) => `/api/v1/users/${id}`,
    DELETE: (id: string) => `/api/v1/users/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/api/v1/dashboard/stats',
    ORDERS: '/api/v1/dashboard/orders',
    ANALYTICS: '/api/v1/dashboard/analytics',
  },

  // Menus
  MENUS: {
    LIST: '/api/v1/menus',
    CREATE: '/api/v1/menus',
    GET: (id: number) => `/api/v1/menus/${id}`,
    UPDATE: (id: number) => `/api/v1/menus/${id}`,
    DELETE: (id: number) => `/api/v1/menus/${id}`,
  },

  // Health Check
  HEALTH: '/api/v1/health',
} as const;
