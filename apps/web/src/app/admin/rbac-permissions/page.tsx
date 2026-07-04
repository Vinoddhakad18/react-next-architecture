'use client';

import { useState, useEffect } from 'react';
import { Button, Checkbox, Select, ExportButton } from '@/components/ui';
import type { Menu, Role } from '@/types/api';
import { menuService, permissionService, roleService, unwrapRbacPermissionsPayload } from '@/services';
import type { SaveRbacPermissionsRequest, RbacPermissionEntry } from '@/types/api/permission';

interface Permission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  status: boolean;
  approval: boolean;
}

interface RolePermissions {
  [menuId: number]: Permission;
}

/**
 * Utility function to ensure a value is a strict boolean
 * Converts truthy/falsy values, null, undefined, strings, numbers to boolean
 */
const toStrictBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'on' || lower === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0 && !isNaN(value);
  }
  return Boolean(value);
};

/**
 * Converts boolean to number (1 for true, 0 for false)
 */
const booleanToNumber = (value: boolean): number => {
  return value ? 1 : 0;
};

/**
 * Validates and sanitizes a permission object to ensure all values are booleans
 */
const sanitizePermission = (perm: Permission | Partial<Permission>): Permission => {
  return {
    view: toStrictBoolean(perm.view),
    add: toStrictBoolean(perm.add),
    edit: toStrictBoolean(perm.edit),
    delete: toStrictBoolean(perm.delete),
    export: toStrictBoolean(perm.export),
    status: toStrictBoolean(perm.status),
    approval: toStrictBoolean(perm.approval),
  };
};

/**
 * Validates the permissions payload before sending to API
 */
const validatePermissionsPayload = (
  roleId: number | null,
  permissions: RolePermissions
): { isValid: boolean; error?: string; payload?: SaveRbacPermissionsRequest } => {
  if (!roleId || roleId <= 0) {
    return { isValid: false, error: 'Invalid role ID' };
  }

  if (!permissions || Object.keys(permissions).length === 0) {
    return { isValid: false, error: 'No permissions to save' };
  }

  const permissionsPayload: RbacPermissionEntry[] = [];

  for (const [menuIdStr, perm] of Object.entries(permissions)) {
    const menuId = Number(menuIdStr);
    
    if (isNaN(menuId) || menuId <= 0) {
      return { isValid: false, error: `Invalid menu ID: ${menuIdStr}` };
    }

    if (!perm || typeof perm !== 'object') {
      return { isValid: false, error: `Invalid permission object for menu ID: ${menuId}` };
    }

    // Sanitize and validate permission
    const sanitized = sanitizePermission(perm);

    // Convert booleans to numbers (1 for true, 0 for false) for API payload
    const validated: RbacPermissionEntry = {
      menu_id: menuId,
      view: booleanToNumber(sanitized.view),
      add: booleanToNumber(sanitized.add),
      edit: booleanToNumber(sanitized.edit),
      delete: booleanToNumber(sanitized.delete),
      export: booleanToNumber(sanitized.export),
      status: booleanToNumber(sanitized.status),
      approval: booleanToNumber(sanitized.approval),
    };

    permissionsPayload.push(validated);
  }

  return {
    isValid: true,
    payload: {
      role_id: roleId,
      permissions: permissionsPayload,
    },
  };
};

export default function RBACPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [originalPermissions, setOriginalPermissions] = useState<RolePermissions>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active roles and menus on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [rolesResponse, menusResponse] = await Promise.all([
          roleService.getActiveRoles(),
          menuService.getActiveMenus(),
        ]);

        if (rolesResponse.success && rolesResponse.data) {
          // Handle different response formats
          let rolesData: Role[] = [];
          if (Array.isArray(rolesResponse.data)) {
            rolesData = rolesResponse.data;
          } else if (rolesResponse.data.data && Array.isArray(rolesResponse.data.data)) {
            rolesData = rolesResponse.data.data;
          } else if (rolesResponse.data.data && Array.isArray(rolesResponse.data)) {
            rolesData = rolesResponse.data as Role[];
          }
          
          if (rolesData.length > 0) {
            setRoles(rolesData);
            if (selectedRole === null && rolesData[0]) {
              setSelectedRole(rolesData[0].id);
            }
          } else {
            setError('No active roles found');
          }
        } else {
          setError(rolesResponse.error?.message || 'Failed to fetch roles');
        }

        if (menusResponse.success && menusResponse.data) {
          // Handle different response formats
          let menusData: Menu[] = [];
          if (Array.isArray(menusResponse.data)) {
            menusData = menusResponse.data;
          } else if (menusResponse.data.data && Array.isArray(menusResponse.data.data)) {
            menusData = menusResponse.data.data;
          } else if (menusResponse.data.data && Array.isArray(menusResponse.data)) {
            menusData = menusResponse.data as Menu[];
          }
          
          if (menusData.length > 0) {
            setMenus(menusData);
          } else {
            setError('No active menus found');
          }
        } else {
          setError(menusResponse.error?.message || 'Failed to fetch menus');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch permissions for selected role
  useEffect(() => {
    if (!selectedRole || menus.length === 0) {
      // Clear permissions if no role is selected or menus are not loaded
      setPermissions({});
      setOriginalPermissions({});
      return;
    }

    const fetchPermissions = async () => {
      setIsLoadingPermissions(true);
      setError(null);

      try {
        const response = await permissionService.getPermissions(selectedRole);

        if (response.success && response.data) {
          const permissionsData = unwrapRbacPermissionsPayload(response.data);
          
          const rolePermissions: RolePermissions = {};
          
          // Initialize all menus with default false permissions
          menus.forEach((menu) => {
            rolePermissions[menu.id] = {
              view: false,
              add: false,
              edit: false,
              delete: false,
              export: false,
              status: false,
              approval: false,
            };
          });

          if (permissionsData?.permissions) {
            permissionsData.permissions.forEach((item) => {
              const apiPerms = item.permissions;
              rolePermissions[item.menu_id] = {
                view: Number(apiPerms.view) === 1,
                add: Number(apiPerms.add) === 1,
                edit: Number(apiPerms.edit) === 1,
                delete: Number(apiPerms.delete) === 1,
                export: Number(apiPerms.export) === 1,
                status: Number(apiPerms.status) === 1,
                approval: Number(apiPerms.approval) === 1,
              };
            });
          }
          
          setPermissions(rolePermissions);
          setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
          setHasChanges(false);
          setSaveSuccess(false);
        } else {
          setError(response.error?.message || 'Failed to fetch permissions');
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching permissions');
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [selectedRole, menus]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
    setHasChanges(changed);
  }, [permissions, originalPermissions]);

  const handleRoleChange = (roleId: number) => {
    if (hasChanges) {
      const confirmChange = window.confirm(
        'You have unsaved changes. Are you sure you want to switch roles?'
      );
      if (!confirmChange) return;
    }
    setSelectedRole(roleId);
  };

  const handlePermissionChange = (
    menuId: number,
    permissionType: keyof Permission,
    value: boolean | unknown
  ) => {
    // Ensure value is a strict boolean
    const booleanValue = toStrictBoolean(value);

    setPermissions((prev) => {
      const currentPerm = prev[menuId] || {
        view: false,
        add: false,
        edit: false,
        delete: false,
        export: false,
        status: false,
        approval: false,
      };

      return {
        ...prev,
        [menuId]: {
          ...currentPerm,
          [permissionType]: booleanValue,
        },
      };
    });
  };

  const handleSelectAllForMenu = (menuId: number, checked: boolean | unknown) => {
    // Ensure checked is a strict boolean
    const booleanValue = toStrictBoolean(checked);

    setPermissions((prev) => ({
      ...prev,
      [menuId]: {
        view: booleanValue,
        add: booleanValue,
        edit: booleanValue,
        delete: booleanValue,
        export: booleanValue,
        status: booleanValue,
        approval: booleanValue,
      },
    }));
  };

  const handleSelectAllMenus = (checked: boolean | unknown) => {
    // Ensure checked is a strict boolean
    const booleanValue = toStrictBoolean(checked);

    const newPermissions: RolePermissions = {};
    menus.forEach((menu) => {
      newPermissions[menu.id] = {
        view: booleanValue,
        add: booleanValue,
        edit: booleanValue,
        delete: booleanValue,
        export: booleanValue,
        status: booleanValue,
        approval: booleanValue,
      };
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Validate and sanitize permissions payload
      const validation = validatePermissionsPayload(selectedRole, permissions);

      if (!validation.isValid || !validation.payload) {
        setError(validation.error || 'Invalid permissions data');
        setIsSaving(false);
        return;
      }


      // Verify all values are numbers (0 or 1)
      const hasInvalidValues = validation.payload.permissions.some((perm) => {
        return (
          typeof perm.view !== 'number' || (perm.view !== 0 && perm.view !== 1) ||
          typeof perm.add !== 'number' || (perm.add !== 0 && perm.add !== 1) ||
          typeof perm.edit !== 'number' || (perm.edit !== 0 && perm.edit !== 1) ||
          typeof perm.delete !== 'number' || (perm.delete !== 0 && perm.delete !== 1) ||
          typeof perm.export !== 'number' || (perm.export !== 0 && perm.export !== 1) ||
          typeof perm.status !== 'number' || (perm.status !== 0 && perm.status !== 1) ||
          typeof perm.approval !== 'number' || (perm.approval !== 0 && perm.approval !== 1)
        );
      });

      if (hasInvalidValues) {
        setError('Invalid permission values detected. All values must be 0 or 1.');
        setIsSaving(false);
        return;
      }

      const response = await permissionService.savePermissions(validation.payload);

      if (response.success) {
        const permissionsData = unwrapRbacPermissionsPayload(response.data);
        
        if (permissionsData?.permissions) {
          const updatedPermissions: RolePermissions = { ...permissions };
          
          permissionsData.permissions.forEach((item) => {
            const apiPerms = item.permissions;
            updatedPermissions[item.menu_id] = {
              view: Number(apiPerms.view) === 1,
              add: Number(apiPerms.add) === 1,
              edit: Number(apiPerms.edit) === 1,
              delete: Number(apiPerms.delete) === 1,
              export: Number(apiPerms.export) === 1,
              status: Number(apiPerms.status) === 1,
              approval: Number(apiPerms.approval) === 1,
            };
          });
          
          setPermissions(updatedPermissions);
          setOriginalPermissions(JSON.parse(JSON.stringify(updatedPermissions)));
        } else {
          setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
        }
        
        setHasChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(response.error?.message || 'Failed to save permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'Are you sure you want to discard all changes?'
      );
      if (!confirmCancel) return;
    }
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
    setSaveSuccess(false);
  };

  const handleExport = async () => {
    if (!selectedRole) {
      setError('Please select a role to export permissions');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await permissionService.exportPermissions({ roleId: selectedRole });
      if (!result.success) {
        setError(result.error?.message || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const getMenuPermissions = (menuId: number): Permission => {
    const perm = permissions[menuId];
    if (!perm) {
      return {
        view: false,
        add: false,
        edit: false,
        delete: false,
        export: false,
        status: false,
        approval: false,
      };
    }
    // Ensure all values are strict booleans
    return sanitizePermission(perm);
  };

  const isAllSelectedForMenu = (menuId: number): boolean => {
    const menuPerms = getMenuPermissions(menuId);
    return (
      menuPerms.view &&
      menuPerms.add &&
      menuPerms.edit &&
      menuPerms.delete &&
      menuPerms.export &&
      menuPerms.status &&
      menuPerms.approval
    );
  };

  const isAnySelectedForMenu = (menuId: number): boolean => {
    const menuPerms = getMenuPermissions(menuId);
    return (
      menuPerms.view ||
      menuPerms.add ||
      menuPerms.edit ||
      menuPerms.delete ||
      menuPerms.export ||
      menuPerms.status ||
      menuPerms.approval
    );
  };

  const isAllSelectedForAllMenus = (): boolean => {
    return menus.every((menu) => isAllSelectedForMenu(menu.id));
  };

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-600">Loading roles and menus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-sm border border-red-200 p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Role-Based Access Control
              </h1>
              <p className="text-slate-600 mt-1">
                Manage permissions for different roles across menu modules
              </p>
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Role
              </label>
              <Select
                value={selectedRole ? String(selectedRole) : ''}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                options={roles.map((role) => ({
                  value: String(role.id),
                  label: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
                }))}
                className="w-full sm:w-auto min-w-[300px]"
                disabled={isLoadingPermissions}
              />
              {selectedRoleData && (
                <p className="text-xs text-slate-500 mt-2">
                  {selectedRoleData.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isLoadingPermissions && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-xs font-medium text-blue-800">
                    Loading permissions...
                  </span>
                </div>
              )}
              {hasChanges && !isLoadingPermissions && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-amber-800">
                    Unsaved changes
                  </span>
                </div>
              )}
              {saveSuccess && !isLoadingPermissions && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-xs font-medium text-green-800">
                    Saved successfully
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Checkbox
                      checked={isAllSelectedForAllMenus()}
                      onChange={(e) => handleSelectAllMenus(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Menu / Module
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    View
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Add
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Edit
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Delete
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Export
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Select All
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPermissions ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                        <p className="text-slate-600 text-sm">Loading permissions...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  menus.map((menu) => {
                  const menuPerms = getMenuPermissions(menu.id);
                  const allSelected = isAllSelectedForMenu(menu.id);
                  const anySelected = isAnySelectedForMenu(menu.id);

                  return (
                    <tr
                      key={menu.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={anySelected && !allSelected}
                          onChange={(e) =>
                            handleSelectAllForMenu(menu.id, e.target.checked)
                          }
                          className="w-5 h-5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {menu.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {menu.name}
                            </div>
                            {menu.description && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {menu.description}
                              </div>
                            )}
                            {menu.route && (
                              <code className="text-xs text-slate-400 mt-1 block">
                                {menu.route}
                              </code>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.view}
                          onChange={(e) =>
                            handlePermissionChange(menu.id, 'view', e.target.checked)
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.add}
                          onChange={(e) =>
                            handlePermissionChange(menu.id, 'add', e.target.checked)
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.edit}
                          onChange={(e) =>
                            handlePermissionChange(menu.id, 'edit', e.target.checked)
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.delete}
                          onChange={(e) =>
                            handlePermissionChange(
                              menu.id,
                              'delete',
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.export}
                          onChange={(e) =>
                            handlePermissionChange(
                              menu.id,
                              'export',
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.status}
                          onChange={(e) =>
                            handlePermissionChange(
                              menu.id,
                              'status',
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.approval}
                          onChange={(e) =>
                            handlePermissionChange(
                              menu.id,
                              'approval',
                              e.target.checked
                            )
                          }
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleSelectAllForMenu(menu.id, !allSelected)
                          }
                          className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          <ExportButton
            allowed={!!selectedRole}
            onExport={handleExport}
            isLoading={isExporting}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
            className="w-full sm:w-auto min-w-[120px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges || isSaving}
            className="w-full sm:w-auto min-w-[120px] shadow-lg hover:shadow-xl transition-shadow"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Menus</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {menus.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Permissions Granted
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {Object.values(permissions).reduce(
                    (acc, perm) =>
                      acc +
                      (perm.view ? 1 : 0) +
                      (perm.add ? 1 : 0) +
                      (perm.edit ? 1 : 0) +
                      (perm.delete ? 1 : 0) +
                      (perm.export ? 1 : 0) +
                      (perm.status ? 1 : 0) +
                      (perm.approval ? 1 : 0),
                    0
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Current Role</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {selectedRoleData?.name || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

