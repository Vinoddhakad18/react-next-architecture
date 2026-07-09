/**
 * Page Permission Types
 *
 * Per-menu action permissions returned by list/detail endpoints, e.g.
 * { menu: "/admin/roles", view: true, add: true, edit: true, delete: true, export: true, status: true, approval: true }
 */

export interface PagePermissions {
  menu: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  status: boolean;
  approval: boolean;
}

export type PagePermissionAction = Exclude<keyof PagePermissions, 'menu'>;

/** Numeric permission flags (1/0) sent to and returned by the RBAC permissions API. */
export interface RbacPermissionFlags {
  view: number;
  add: number;
  edit: number;
  delete: number;
  export: number;
  status: number;
  approval: number;
}

export interface RbacPermissionEntry {
  menu_id: number;
  view: number;
  add: number;
  edit: number;
  delete: number;
  export: number;
  status: number;
  approval: number;
}

export interface SaveRbacPermissionsRequest {
  role_id: number;
  permissions: RbacPermissionEntry[];
}

export interface RbacPermissionsResponse {
  role_id: number;
  permissions: Array<{
    menu_id: number;
    permissions: RbacPermissionFlags;
  }>;
}
