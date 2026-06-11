'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Branch, BranchListParams, CreateBranchRequest, UpdateBranchRequest } from '@/types/api/branch';
import { ActionButton, Button, Input, Modal, Select, RowActions } from '@/components/ui';
import { branchService } from '@/services';
import { usePagePermissions } from '@/hooks/usePagePermissions';

export default function BranchManagementPage() {
  const [filters, setFilters] = useState<BranchListParams>({
    page: 1,
    limit: 10,
    sortBy: 'branch_name',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBranchRequest>({
    branch_name: '',
    branch_code: '',
    address: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateBranchRequest, string>>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { permissions, setFromResponse } = usePagePermissions();

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: BranchListParams = {
        ...filters,
        ...(searchTerm ? { search: searchTerm } : {}),
      };

      const response = await branchService.getBranches(params);
      if (response.success && response.data) {
        setFromResponse(response.data);
        setBranches(response.data.data);
        setPagination(response.data.meta);
      } else {
        setBranches([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
        setError(response.error?.message || 'Failed to load branches');
      }
    } catch (err) {
      setBranches([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm, setFromResponse]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({ page: 1, limit: 10, sortBy: 'branch_name', sortOrder: 'ASC' });
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingBranchId(null);
    setFormData({
      branch_name: '',
      branch_code: '',
      address: '',
      status: 'active',
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
    setIsEditMode(false);
    setEditingBranchId(null);
  };

  const handleEditBranch = (branch: Branch) => {
    setIsEditMode(true);
    setEditingBranchId(branch.id);
    setFormData({
      branch_name: branch.branchName,
      branch_code: branch.branchCode,
      address: branch.address,
      status: branch.status,
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setBranchToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await branchService.deleteBranch(branchToDelete.id);
      if (response.success) {
        handleCloseDeleteModal();
        await fetchBranches();
      } else {
        setSubmitError(response.error?.message || 'Failed to delete branch');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof CreateBranchRequest, string>> = {};

    if (!formData.branch_name.trim()) {
      errors.branch_name = 'Branch name is required';
    }
    if (!formData.branch_code.trim()) {
      errors.branch_code = 'Branch code is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!formData.status.trim()) {
      errors.status = 'Status is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response;

      const payload: UpdateBranchRequest = {
        branch_name: formData.branch_name.trim(),
        branch_code: formData.branch_code.trim(),
        address: formData.address.trim(),
        status: formData.status.trim(),
      };

      if (isEditMode && editingBranchId !== null) {
        response = await branchService.updateBranch(editingBranchId, payload);
      } else {
        response = await branchService.createBranch(payload as CreateBranchRequest);
      }

      if (response.success && response.data) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingBranchId(null);
        await fetchBranches();
      } else {
        setSubmitError(response.error?.message || 'Failed to save branch');
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
          <h1 className="text-2xl font-semibold text-slate-900">Branch Management</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage your branch list.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search branches"
            className="min-w-[240px]"
          />
          <Button onClick={handleSearch} variant="secondary">Search</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
          {permissions.add && (
            <ActionButton type="button" action="add" onClick={handleOpenModal}>
              Add Branch
            </ActionButton>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-700">Branch list</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading branches...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-rose-500">{error}</div>
        ) : branches.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No branches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-700">Branch Name</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Branch Code</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Address</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 text-slate-900">{branch.branchName}</td>
                    <td className="px-6 py-4 text-slate-700">{branch.branchCode}</td>
                    <td className="px-6 py-4 text-slate-700">{branch.address}</td>
                    <td className="px-6 py-4 text-slate-700">{branch.status}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <RowActions
                        permissions={permissions}
                        onEdit={() => handleEditBranch(branch)}
                        onDelete={() => handleDeleteClick(branch)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={isEditMode ? 'Edit Branch' : 'Add New Branch'}
          size="md"
        >
          <form onSubmit={handleSubmitBranch} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Branch Name"
                value={formData.branch_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, branch_name: e.target.value }))}
                error={formErrors.branch_name}
              />
              <Input
                label="Branch Code"
                value={formData.branch_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, branch_code: e.target.value }))}
                error={formErrors.branch_code}
              />
            </div>
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              error={formErrors.address}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              error={formErrors.status}
            />
            {submitError ? (
              <p className="text-sm text-rose-500">{submitError}</p>
            ) : null}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {isEditMode ? 'Update Branch' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Branch" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{branchToDelete?.branchName}</span>?
            </p>
            {submitError ? (
              <p className="text-sm text-rose-500">{submitError}</p>
            ) : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDeleteModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteBranch}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total}</span> branches
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
    </div>
  );
}
