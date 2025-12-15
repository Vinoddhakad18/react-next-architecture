'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Checkbox, Select } from '@/components/ui';
import type { Menu } from '@/types/api';
import { mockMenus } from '@/data/menus';

interface Permission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  status: boolean;
}

interface RolePermissions {
  [menuId: number]: Permission;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

const ROLES: Role[] = [
  { id: 1, name: 'Administrator', description: 'Full system access' },
  { id: 2, name: 'Editor', description: 'Can read and write content' },
  { id: 3, name: 'Viewer', description: 'Read-only access' },
  { id: 4, name: 'Guest', description: 'Limited access' },
];

export default function RBACPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<number>(1);
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [originalPermissions, setOriginalPermissions] = useState<RolePermissions>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [menus] = useState<Menu[]>(mockMenus);

  // Initialize permissions for selected role
  useEffect(() => {
    // Load permissions for the selected role (in a real app, this would come from an API)
    const rolePermissions: RolePermissions = {};
    
    menus.forEach((menu) => {
      // Initialize with default permissions based on role
      if (selectedRole === 1) {
        // Administrator - all permissions
        rolePermissions[menu.id] = {
          view: true,
          add: true,
          edit: true,
          delete: true,
          export: true,
          status: true,
        };
      } else if (selectedRole === 2) {
        // Editor - view, add, edit, export
        rolePermissions[menu.id] = {
          view: true,
          add: true,
          edit: true,
          delete: false,
          export: true,
          status: menu.isActive,
        };
      } else if (selectedRole === 3) {
        // Viewer - view and export only
        rolePermissions[menu.id] = {
          view: true,
          add: false,
          edit: false,
          delete: false,
          export: true,
          status: menu.isActive,
        };
      } else {
        // Guest - view only
        rolePermissions[menu.id] = {
          view: true,
          add: false,
          edit: false,
          delete: false,
          export: false,
          status: false,
        };
      }
    });

    setPermissions(rolePermissions);
    setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
    setHasChanges(false);
    setSaveSuccess(false);
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
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [permissionType]: value,
      },
    }));
  };

  const handleSelectAllForMenu = (menuId: number, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [menuId]: {
        view: checked,
        add: checked,
        edit: checked,
        delete: checked,
        export: checked,
        status: checked,
      },
    }));
  };

  const handleSelectAllMenus = (checked: boolean) => {
    const newPermissions: RolePermissions = {};
    menus.forEach((menu) => {
      newPermissions[menu.id] = {
        view: checked,
        add: checked,
        edit: checked,
        delete: checked,
        export: checked,
        status: checked,
      };
    });
    setPermissions(newPermissions);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
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

  const getMenuPermissions = (menuId: number): Permission => {
    return permissions[menuId] || {
      view: false,
      add: false,
      edit: false,
      delete: false,
      export: false,
      status: false,
    };
  };

  const isAllSelectedForMenu = (menuId: number): boolean => {
    const menuPerms = getMenuPermissions(menuId);
    return (
      menuPerms.view &&
      menuPerms.add &&
      menuPerms.edit &&
      menuPerms.delete &&
      menuPerms.export &&
      menuPerms.status
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
      menuPerms.status
    );
  };

  const isAllSelectedForAllMenus = (): boolean => {
    return menus.every((menu) => isAllSelectedForMenu(menu.id));
  };

  const selectedRoleData = ROLES.find((r) => r.id === selectedRole);

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
                value={String(selectedRole)}
                onChange={(e) => handleRoleChange(Number(e.target.value))}
                options={ROLES.map((role) => ({
                  value: String(role.id),
                  label: `${role.name} - ${role.description}`,
                }))}
                className="w-full sm:w-auto min-w-[300px]"
              />
              {selectedRoleData && (
                <p className="text-xs text-slate-500 mt-2">
                  {selectedRoleData.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
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
              {saveSuccess && (
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
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Select All
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menus.map((menu) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
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
                      (perm.status ? 1 : 0),
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

