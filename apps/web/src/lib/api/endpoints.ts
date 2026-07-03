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
    APPROVE: (id: string) => `/api/v1/users/${id}/approve`,
    REJECT: (id: string) => `/api/v1/users/${id}/reject`,
    STATUS: (id: string) => `/api/v1/users/${id}/status`,
    EXPORT: '/api/v1/users/export',
  },

  // Approval requests (maker-checker workflow)
  APPROVALS: {
    APPROVE: (requestId: number) => `/api/v1/approvals/${requestId}/approve`,
    REJECT: (requestId: number) => `/api/v1/approvals/${requestId}/reject`,
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
    ACTIVE_LIST: '/api/v1/menus/active/list',
    TREE: '/api/v1/menus/tree',
    CREATE: '/api/v1/menus',
    GET: (id: number) => `/api/v1/menus/${id}`,
    UPDATE: (id: number) => `/api/v1/menus/${id}`,
    DELETE: (id: number) => `/api/v1/menus/${id}`,
    APPROVE: (id: number) => `/api/v1/menus/${id}/approve`,
    REJECT: (id: number) => `/api/v1/menus/${id}/reject`,
    STATUS: (id: number) => `/api/v1/menus/${id}/status`,
    EXPORT: '/api/v1/menus/export',
  },

  // Roles
  ROLES: {
    LIST: '/api/v1/roles',
    ACTIVE_LIST: '/api/v1/roles/active/list',
    CREATE: '/api/v1/roles',
    GET: (id: number) => `/api/v1/roles/${id}`,
    UPDATE: (id: number) => `/api/v1/roles/${id}`,
    DELETE: (id: number) => `/api/v1/roles/${id}`,
    APPROVE: (id: number) => `/api/v1/roles/${id}/approve`,
    REJECT: (id: number) => `/api/v1/roles/${id}/reject`,
    STATUS: (id: number) => `/api/v1/roles/${id}/status`,
    EXPORT: '/api/v1/roles/export',
  },

  // Branches
  BRANCHES: {
    LIST: '/api/v1/branches',
    TREE: '/api/v1/branches/tree',
    CREATE: '/api/v1/branches',
    GET: (id: number) => `/api/v1/branches/${id}`,
    UPDATE: (id: number) => `/api/v1/branches/${id}`,
    DELETE: (id: number) => `/api/v1/branches/${id}`,
    APPROVE: (id: number) => `/api/v1/branches/${id}/approve`,
    REJECT: (id: number) => `/api/v1/branches/${id}/reject`,
    STATUS: (id: number) => `/api/v1/branches/${id}/status`,
    EXPORT: '/api/v1/branches/export',
  },

  // Health Check
  HEALTH: '/api/v1/health',
} as const;
