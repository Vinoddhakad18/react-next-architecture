/**
 * Application Routes
 * Centralized route definitions
 */

export const ROUTES = {
  HOME: '/',

  // Auth routes
  LOGIN: '/admin/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Admin routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
    PROFILE: '/admin/profile',
  },

  // Public routes
  PUBLIC: {
    ABOUT: '/about',
    CONTACT: '/contact',
    TERMS: '/terms',
    PRIVACY: '/privacy',
  },

  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.PUBLIC.ABOUT,
  ROUTES.PUBLIC.CONTACT,
  ROUTES.PUBLIC.TERMS,
  ROUTES.PUBLIC.PRIVACY,
  ROUTES.NOT_FOUND,
  ROUTES.UNAUTHORIZED,
  ROUTES.SERVER_ERROR,
] as const;

export const PROTECTED_ROUTES = [
  ROUTES.ADMIN.ROOT,
  ROUTES.ADMIN.DASHBOARD,
  ROUTES.ADMIN.USERS,
  ROUTES.ADMIN.SETTINGS,
  ROUTES.ADMIN.PROFILE,
] as const;
