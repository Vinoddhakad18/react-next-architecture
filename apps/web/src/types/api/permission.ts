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
