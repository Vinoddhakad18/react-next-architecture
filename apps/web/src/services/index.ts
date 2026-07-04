/**
 * Services Module Exports
 */

export { authService } from './auth.service';
export { menuService, normalizeMenu } from './menu.service';
export type { CreateMenuRequest } from './menu.service';
export { roleService, normalizeRole } from './role.service';
export type { CreateRoleRequest } from './role.service';
export { branchService } from './branch.service';
export { userService } from './user.service';
export { permissionService, unwrapRbacPermissionsPayload } from './permission.service';
export { normalizeUser } from '@/lib/utils/normalizeUser';
export type { UpdateUserRequest } from '@/types/api/user';
