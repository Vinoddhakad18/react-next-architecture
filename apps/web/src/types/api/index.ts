/**
 * API Type Definitions
 */

export * from './auth';
export * from './common';
export * from './menu';
export * from './permission';
export * from './role';
export * from './branch';
// `User` is intentionally re-exported from './auth' (the authenticated account
// shape). The user-management entity in './user' is a different shape and must
// be imported directly from '@/types/api/user' to avoid a name clash.
export type { UserListParams, UserListResponse, UpdateUserRequest } from './user';

