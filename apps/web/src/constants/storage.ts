/**
 * Storage Keys
 * Centralized localStorage and sessionStorage keys
 */

export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',

  // User preferences
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',

  // UI state
  LAST_VISITED_PAGE: 'lastVisitedPage',
  DASHBOARD_LAYOUT: 'dashboardLayout',
  TABLE_PREFERENCES: 'tablePreferences',

  // Temporary data
  FORM_DRAFT: 'formDraft',
  SEARCH_HISTORY: 'searchHistory',
} as const;

export const SESSION_STORAGE_KEYS = {
  REDIRECT_URL: 'redirectUrl',
  TEMP_DATA: 'tempData',
} as const;
