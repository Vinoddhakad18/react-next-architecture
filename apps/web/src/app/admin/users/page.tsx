'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { User, UserListParams, UpdateUserRequest, CreateUserRequest } from '@/types/api/user';
import type { BranchTreeNode } from '@/types/api/branch';
import { Button, Input, Modal, Select, RowActions, BranchTreeSelect } from '@/components/ui';
import { userService, roleService, branchService } from '@/services';
import { createUserSchema, updateUserSchema } from '@/lib/validation/userSchemas';
import { usePagePermissions } from '@/hooks/usePagePermissions';

export default function UserManagementPage() {
  const [filters, setFilters] = useState<UserListParams>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: '', email: '', mobile: '', roleId: 0, branchIds: [], password: '',
  });
  const [roleOptions, setRoleOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [branchTree, setBranchTree] = useState<BranchTreeNode[]>([]);

  const emptyCreate: CreateUserRequest = { name: '', email: '', password: '', mobile: '', roleId: 0, branchIds: [] };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState<CreateUserRequest>(emptyCreate);
  const { permissions, setFromResponse } = usePagePermissions();

  useEffect(() => {
    (async () => {
      const [rolesRes, branchesRes] = await Promise.all([
        roleService.getActiveRoles(),
        branchService.getBranchTree(true),
      ]);
      const roles: any[] = Array.isArray(rolesRes.data)
        ? rolesRes.data
        : (rolesRes.data as any)?.data ?? [];
      setRoleOptions(roles.map((r) => ({ value: r.id, label: r.name })));
      const tree = Array.isArray(branchesRes.data)
        ? branchesRes.data
        : (branchesRes.data as any)?.data ?? [];
      setBranchTree(tree);
    })().catch((err) => { console.error('[Users] Failed to load roles/branches', err); });
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: UserListParams = {
        ...filters,
        ...(searchTerm ? { search: searchTerm } : {}),
      };

      const response = await userService.getUsers(params);
      if (response.success && response.data) {
        setFromResponse(response.data);

        const payload = response.data as { data:any; meta: { page: number; limit: number; total: number; totalPages: number } };
        const normalizedUsers = Array.isArray(payload?.data?.data)
          ? payload?.data?.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setUsers(normalizedUsers as User[]);
        setPagination(
          payload.meta ?? {
            page: params.page || 1,
            limit: params.limit || 10,
            total: normalizedUsers.length,
            totalPages: Math.max(1, Math.ceil(normalizedUsers.length / (params.limit || 10))),
          }
        );
      } else {
        setUsers([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
        setError(response.error?.message || 'Failed to load users');
      }
    } catch (err) {
      setUsers([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm, setFromResponse]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({ page: 1, limit: 10, sortBy: 'name', sortOrder: 'ASC' });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? '',
      roleId: user.roleId ?? 0,
      branchIds: user.branchIds ?? [],
      password: '',
    });
    setSubmitError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setSubmitError(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setSubmitError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
    setIsDeleteModalOpen(false);
    setSubmitError(null);
  };

  const handleOpenCreate = () => {
    setCreateData(emptyCreate);
    setSubmitError(null);
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setSubmitError(null);
  };

  const handleSubmitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createUserSchema.safeParse(createData);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Please fix validation errors');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await userService.createUser(parsed.data as CreateUserRequest);
      if (response.success) {
        handleCloseCreate();
        await fetchUsers();
      } else {
        setSubmitError(response.error?.message || 'Failed to create user');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    const candidate: UpdateUserRequest = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      ...(formData.mobile ? { mobile: formData.mobile } : {}),
      ...(formData.roleId ? { roleId: formData.roleId } : {}),
      ...(formData.branchIds && formData.branchIds.length ? { branchIds: formData.branchIds } : {}),
    };

    const parsed = updateUserSchema.safeParse(candidate);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Please fix validation errors');
      return;
    }

    const { password, ...rest } = parsed.data;
    const payload: UpdateUserRequest = { ...rest, ...(password ? { password } : {}) };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await userService.updateUser(editingUser.id, payload);
      if (response.success) { handleCloseEditModal(); await fetchUsers(); }
      else { setSubmitError(response.error?.message || 'Failed to update user'); }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await userService.deleteUser(userToDelete.id);
      if (response.success) {
        handleCloseDeleteModal();
        await fetchUsers();
      } else {
        setSubmitError(response.error?.message || 'Failed to delete user');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">View, edit, and soft delete users.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search users"
            className="min-w-[240px]"
          />
          <Button onClick={handleSearch} variant="secondary">Search</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
          {permissions.add && (
            <Button onClick={handleOpenCreate} variant="primary">Add User</Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-700">User list</div>
          <div className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages || 1}</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading users...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-rose-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-700">Name</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Role</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user?.id}>
                    <td className="px-6 py-4 text-slate-900">{user?.name}</td>
                    <td className="px-6 py-4 text-slate-700">{user?.email}</td>
                    <td className="px-6 py-4 text-slate-700">{user?.roleName}</td>
                    <td className="px-6 py-4 text-slate-700">{user?.status}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <RowActions
                        permissions={permissions}
                        onEdit={() => handleEditUser(user)}
                        onDelete={() => handleDeleteClick(user)}
                        canDelete={user?.roleName !== 'super_admin'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-700">Page {pagination.page} of {pagination.totalPages || 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} title="Add User" size="md">
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <Input
            label="Name"
            value={createData.name}
            onChange={(e) => setCreateData((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={createData.email}
            onChange={(e) => setCreateData((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={createData.password}
            onChange={(e) => setCreateData((p) => ({ ...p, password: e.target.value }))}
          />
          <Input
            label="Mobile"
            value={createData.mobile}
            onChange={(e) => setCreateData((p) => ({ ...p, mobile: e.target.value }))}
          />
          <Select
            label="Role"
            value={createData.roleId || ''}
            onChange={(e) => setCreateData((p) => ({ ...p, roleId: Number(e.target.value) }))}
            options={[{ value: '', label: 'Select a role' }, ...roleOptions]}
          />
          <BranchTreeSelect
            label="Branches"
            tree={branchTree}
            selectedIds={createData.branchIds}
            onChange={(branchIds) => setCreateData((p) => ({ ...p, branchIds }))}
          />
          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseCreate} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit User" size="md">
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Mobile"
            value={formData.mobile || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
          />
          <Select
            label="Role"
            value={formData.roleId || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, roleId: Number(e.target.value) }))}
            options={[{ value: '', label: 'Select a role' }, ...roleOptions]}
          />
          <BranchTreeSelect
            label="Branches"
            tree={branchTree}
            selectedIds={formData.branchIds ?? []}
            onChange={(branchIds) => setFormData((prev) => ({ ...prev, branchIds }))}
          />
          <Input
            label="New password (leave blank to keep current)"
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          />
          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseEditModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to soft delete{' '}
            <span className="font-semibold">{userToDelete?.name}</span>?
          </p>
          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseDeleteModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteUser}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
