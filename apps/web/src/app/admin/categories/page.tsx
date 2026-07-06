'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, CategoryListParams } from '@/types/api/category';
import {
  ActionButton,
  Button,
  Modal,
  Input,
  Checkbox,
  Select,
  RowActions,
  ExportButton,
  EntityApprovalCell,
  EntityApprovalReviewModal,
  UserApprovalActionModal,
} from '@/components/ui';
import { categoryService } from '@/services';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { useEntityWorkflow } from '@/hooks/useEntityWorkflow';
import { useModuleApprovalUi } from '@/hooks/useApprovalActionFlow';

interface CategoryFormData {
  name: string;
  code: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
}

export default function CategoryManagementPage() {
  const [filters, setFilters] = useState<CategoryListParams>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    code: '',
    description: '',
    parent_id: null,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});
  const { permissions, setFromResponse } = usePagePermissions();

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: CategoryListParams = {
        ...filters,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await categoryService.getCategories(params);

      if (response.success && response.data) {
        setFromResponse(response.data);

        const list = response.data;
        setCategories(Array.isArray(list.data) ? list.data : []);
        setPagination({
          page: list.meta?.page ?? filters.page ?? 1,
          limit: list.meta?.limit ?? filters.limit ?? 10,
          total: list.meta?.total ?? 0,
          totalPages: list.meta?.totalPages ?? 0,
        });
      } else {
        setError(response.error?.message || 'Failed to fetch categories');
        setCategories([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm, setFromResponse]);

  const loadParentCategories = useCallback(async () => {
    const response = await categoryService.getActiveCategories();
    if (response.success && response.data) {
      setParentCategories(Array.isArray(response.data) ? response.data : []);
    }
  }, []);

  const {
    workflowLoadingId,
    isExporting,
    handleToggleStatus,
    handleExport,
  } = useEntityWorkflow({
    onRefresh: fetchCategories,
    onError: setError,
    toggleStatus: (id, active) => categoryService.toggleCategoryStatus(Number(id), active),
    exportData: () =>
      categoryService.exportCategories({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: searchTerm || undefined,
      }),
  });

  const {
    reviewItem: reviewCategory,
    setReviewItem: setReviewCategory,
    approvalAction,
    approvalComment,
    rejectReason,
    approvalActionError,
    isSubmitting: isApprovalSubmitting,
    openApprovalAction,
    closeApprovalAction,
    submitApprovalAction,
    setApprovalComment,
    setRejectReason,
  } = useModuleApprovalUi<Category>({
    onRefresh: fetchCategories,
    onError: setError,
    approveRequest: categoryService.approveCategoryRequest,
    rejectRequest: categoryService.rejectCategoryRequest,
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadParentCategories();
  }, [loadParentCategories]);

  const paginatedCategories = Array.isArray(categories) ? categories : [];

  const parentCategoryOptions = useMemo(() => {
    const options = [{ value: '', label: 'None (Top Level)' }];
    parentCategories
      .filter((cat) => !isEditMode || cat.id !== editingCategoryId)
      .forEach((cat) => {
        options.push({ value: String(cat.id), label: `${cat.name} (${cat.code})` });
      });
    return options;
  }, [parentCategories, isEditMode, editingCategoryId]);

  const getParentDisplayName = (category: Category) => {
    if (category.parentName) {
      return category.parentName;
    }
    if (category.parentId == null) {
      return '-';
    }
    const parent = categories.find((c) => c.id === category.parentId);
    return parent ? parent.name : `#${category.parentId}`;
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({ page: 1, limit: 10, sortBy: 'name', sortOrder: 'ASC' });
  };

  const resetForm = () => ({
    name: '',
    code: '',
    description: '',
    parent_id: null,
    is_active: true,
  });

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingCategoryId(null);
    setIsModalOpen(true);
    setFormData(resetForm());
    setFormErrors({});
    setSubmitError(null);
  };

  const handleEditCategory = (category: Category) => {
    setIsEditMode(true);
    setEditingCategoryId(category.id);
    setIsModalOpen(true);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      parent_id: category.parentId ?? null,
      is_active: category.isActive,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingCategoryId(null);
    setFormData(resetForm());
    setFormErrors({});
    setSubmitError(null);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategoryId(categoryToDelete.id);
    setError(null);

    try {
      const result = await categoryService.deleteCategory(categoryToDelete.id);

      if (!result.success || result.error) {
        setError(result.error?.message || 'Failed to delete category');
        setDeletingCategoryId(null);
        return;
      }

      await fetchCategories();
      await loadParentCategories();
      handleCloseDeleteModal();
      setDeletingCategoryId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setDeletingCategoryId(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CategoryFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        parent_id: formData.parent_id,
        status: formData.is_active,
      };

      if (isEditMode && editingCategoryId !== null) {
        const result = await categoryService.updateCategory(editingCategoryId, payload);

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to update category');
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await categoryService.createCategory(payload);

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to create category');
          setIsSubmitting(false);
          return;
        }
      }

      await fetchCategories();
      await loadParentCategories();
      handleCloseModal();
      setIsSubmitting(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return filters.sortOrder === 'ASC' ? (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category Master
              </h1>
              <p className="text-slate-600 mt-1">Manage product and item categories</p>
            </div>
            {permissions.add && (
              <Button variant="primary" onClick={handleOpenModal} className="shadow-lg hover:shadow-xl transition-shadow">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Category
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search categories by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSearch} className="px-6">
                Search
              </Button>
              <Button variant="outline" onClick={handleReset} className="px-6">
                Reset
              </Button>
              <ExportButton allowed={permissions.export} onExport={handleExport} isLoading={isExporting} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Total Categories</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {paginatedCategories.filter((c) => c.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {paginatedCategories.filter((c) => !c.isActive).length}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading categories...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <p className="text-lg font-semibold text-slate-900 mb-2">Error Loading Categories</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-lg font-semibold text-slate-900 mb-2">No categories found</p>
              <p className="text-slate-600 mb-6">Get started by creating your first category</p>
              {permissions.add && (
                <ActionButton type="button" action="add" onClick={handleOpenModal}>
                  Add Your First Category
                </ActionButton>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button onClick={() => handleSort('id')} className="flex items-center space-x-2 hover:text-purple-600 transition-colors">
                          <span>ID</span>
                          {getSortIcon('id')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button onClick={() => handleSort('name')} className="flex items-center space-x-2 hover:text-purple-600 transition-colors">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button onClick={() => handleSort('code')} className="flex items-center space-x-2 hover:text-purple-600 transition-colors">
                          <span>Code</span>
                          {getSortIcon('code')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Approval
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCategories.map((category) => {
                      const requestId = category.approval?.requestId;

                      return (
                        <tr
                          key={`${category.id}-${requestId ?? 'row'}`}
                          className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900">#{category.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600 font-mono">{category.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 max-w-xs truncate">
                              {category.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600">{getParentDisplayName(category)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              className="text-left disabled:cursor-default"
                              title={category.approval?.hasPending ? 'View requested changes' : undefined}
                              onClick={() => setReviewCategory(category)}
                              disabled={!category.approval?.hasPending}
                            >
                              <EntityApprovalCell
                                approval={category.approval}
                                isPendingCreate={category.isPendingCreate}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(category.isActive)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RowActions
                              permissions={permissions}
                              approvalStatus={category.approvalStatus}
                              isActive={category.isActive}
                              approvalOnly={Boolean(category.approval?.hasPending)}
                              onEdit={category.isPendingCreate ? undefined : () => handleEditCategory(category)}
                              onDelete={category.isPendingCreate ? undefined : () => handleDeleteClick(category)}
                              onApprove={
                                requestId && category.approval?.hasPending
                                  ? () => openApprovalAction(requestId, 'approve')
                                  : undefined
                              }
                              onReject={
                                requestId && category.approval?.hasPending
                                  ? () => openApprovalAction(requestId, 'reject')
                                  : undefined
                              }
                              onToggleStatus={
                                category.isPendingCreate
                                  ? undefined
                                  : () => handleToggleStatus(category.id, !category.isActive)
                              }
                              actionLoading={
                                workflowLoadingId === category.id ||
                                deletingCategoryId === category.id ||
                                (requestId != null &&
                                  isApprovalSubmitting &&
                                  approvalAction?.requestId === requestId)
                              }
                              className="flex items-center space-x-3"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing{' '}
                    <span className="font-semibold text-slate-900">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-900">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-900">{pagination.total}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
            error={formErrors.name}
            required
          />

          <Input
            label="Code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Enter category code"
            error={formErrors.code}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <Select
            label="Parent Category"
            value={formData.parent_id != null ? String(formData.parent_id) : ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                parent_id: e.target.value && e.target.value !== '' ? parseInt(e.target.value, 10) : null,
              })
            }
            options={parentCategoryOptions}
            helperText="Select a parent category or leave as 'None' for top-level"
          />

          <Checkbox
            label="Is Active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />

          {submitError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              {isEditMode ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-700 font-medium">Are you sure you want to delete this category?</p>
          {categoryToDelete && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span className="text-sm font-semibold text-slate-900">
                {categoryToDelete.name} ({categoryToDelete.code})
              </span>
            </div>
          )}
          <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleCloseDeleteModal} disabled={deletingCategoryId !== null}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteCategory}
              isLoading={deletingCategoryId !== null}
              disabled={deletingCategoryId !== null}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>

      <EntityApprovalReviewModal
        isOpen={Boolean(reviewCategory)}
        approval={reviewCategory?.approval}
        permissions={permissions}
        emptyMessage="No pending approval for this category."
        onClose={() => setReviewCategory(null)}
        onApprove={(requestId) => openApprovalAction(requestId, 'approve')}
        onReject={(requestId) => openApprovalAction(requestId, 'reject')}
      />

      <UserApprovalActionModal
        isOpen={Boolean(approvalAction)}
        type={approvalAction?.type ?? null}
        comment={approvalComment}
        reason={rejectReason}
        error={approvalActionError}
        isSubmitting={isApprovalSubmitting}
        onCommentChange={setApprovalComment}
        onReasonChange={setRejectReason}
        onClose={closeApprovalAction}
        onSubmit={submitApprovalAction}
      />
    </div>
  );
}
