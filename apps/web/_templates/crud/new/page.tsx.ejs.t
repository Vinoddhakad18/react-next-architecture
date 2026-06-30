---
to: src/app/admin/<%= plural %>/page.tsx
---
'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type {
  <%= entityPascal %>,
  <%= entityPascal %>ListParams,
  Update<%= entityPascal %>Request,
} from '@/types/api/<%= singular %>';
import { Button, Checkbox, Input, Modal, Select } from '@/components/ui';
import { <%= entityCamel %>Service } from '@/services';

export default function <%= pluralPascal %>ManagementPage() {
  const [filters, setFilters] = useState<<%= entityPascal %>ListParams>({
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<<%= entityPascal %>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<<%= entityPascal %> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<<%= entityPascal %> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Update<%= entityPascal %>Request, string>>>({});
  const [formData, setFormData] = useState<Update<%= entityPascal %>Request>({
    <% fields.forEach((field, index) => { %><%= field.name %>: <%- field.defaultValue %><%= index < fields.length - 1 ? ',' : '' %>
    <% }) %>
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: <%= entityPascal %>ListParams = {
        ...filters,
        ...(searchTerm ? { search: searchTerm } : {}),
      };
      const response = await <%= entityCamel %>Service.get<%= pluralPascal %>(params);

      if (response.success && response.data) {
        const payload = response.data as unknown as { data?: unknown; meta?: any };
        const normalized = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setItems(normalized as <%= entityPascal %>[]);
        setPagination(
          payload.meta ?? {
            page: params.page || 1,
            limit: params.limit || 10,
            total: normalized.length,
            totalPages: Math.max(1, Math.ceil(normalized.length / (params.limit || 10))),
          }
        );
      } else {
        setItems([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
        setError(response.error?.message || 'Failed to load items');
      }
    } catch (err) {
      setItems([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({ page: 1, limit: 10, sortBy: 'id', sortOrder: 'ASC' });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({
      <% fields.forEach((field, index) => { %><%= field.name %>: <%- field.defaultValue %><%= index < fields.length - 1 ? ',' : '' %>
      <% }) %>
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: <%= entityPascal %>) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      <% fields.forEach((field, index) => { %><%= field.name %>: item.<%= field.name %> as any<%= index < fields.length - 1 ? ',' : '' %>
      <% }) %>
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingItem(null);
    setFormErrors({});
    setSubmitError(null);
  };

  const handleDeleteClick = (item: <%= entityPascal %>) => {
    setItemToDelete(item);
    setSubmitError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
    setSubmitError(null);
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof Update<%= entityPascal %>Request, string>> = {};

    <% fields.forEach((field) => { %>
    const <%= field.name %>Value = formData.<%= field.name %>;
    <% if (field.inputType === 'checkbox') { %>
    // No required validation for checkbox fields by default.
    <% } else { %>
    if (<%= field.name %>Value === undefined || <%= field.name %>Value === null || <%= field.name %>Value.toString().trim() === '') {
      errors.<%= field.name %> = '<%= field.label %> is required';
    }
    <% } %>
    <% }) %>

    setFormErrors(errors);
    setSubmitError(Object.keys(errors).length ? 'Please fix validation errors.' : null);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEditMode && !editingItem) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        <% fields.forEach((field, index) => { %><%= field.name %>: formData.<%= field.name %><%= index < fields.length - 1 ? ',' : '' %>
        <% }) %>
      };

      const response = isEditMode && editingItem
        ? await <%= entityCamel %>Service.update<%= entityPascal %>(editingItem.id as string, payload)
        : await <%= entityCamel %>Service.create<%= entityPascal %>(payload);

      if (response.success) {
        handleCloseModal();
        await fetchItems();
      } else {
        setSubmitError(response.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} item.`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await <%= entityCamel %>Service.delete<%= entityPascal %>(itemToDelete.id as string);

      if (response.success) {
        handleCloseDeleteModal();
        await fetchItems();
      } else {
        setSubmitError(response.error?.message || 'Failed to delete item.');
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
          <h1 className="text-2xl font-semibold text-slate-900"><%= entityPascal %> Management</h1>
          <p className="mt-1 text-sm text-slate-500">View, create, update, and delete <%= plural %>.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search <%= plural %>"
            className="min-w-[240px]"
          />
          <Button onClick={handleSearch} variant="secondary">Search</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
          <Button onClick={handleOpenCreateModal} variant="primary">Add <%= entityPascal %></Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-700"><%= entityPascal %> list</div>
          <div className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages || 1}</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading <%= plural %>...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-rose-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No <%= plural %> found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <% fields.forEach((field) => { %><th className="px-6 py-3 font-medium text-slate-700"><%= field.label %></th><% }) %>
                  <th className="px-6 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <% fields.forEach((field) => { %>
                    <td className="px-6 py-4 text-slate-700">
                      {typeof item.<%= field.name %> === 'boolean' ? (item.<%= field.name %> ? 'Yes' : 'No') : item.<%= field.name %>}
                    </td>
                    <% }) %>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleEditItem(item)}>
                          Edit
                        </Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => handleDeleteClick(item)}>
                          Delete
                        </Button>
                      </div>
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
            <span className="font-semibold text-slate-900">{pagination.total}</span> <%= plural %>
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? 'Edit <%= entityPascal %>' : 'Add <%= entityPascal %>'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <% fields.forEach((field) => { %>
            <% if (field.inputType === 'checkbox') { %>
              <Checkbox
                label="<%= field.label %>"
                checked={formData.<%= field.name %> || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, <%= field.name %>: e.target.checked }))}
                error={formErrors.<%= field.name %>}
              />
            <% } else if (field.inputType === 'select') { %>
              <Select
                label="<%= field.label %>"
                value={formData.<%= field.name %> || ''}
                error={formErrors.<%= field.name %>}
                onChange={(e) => setFormData((prev) => ({ ...prev, <%= field.name %>: e.target.value }))}
                options={[
                  <% field.options.forEach((option, index) => { %>{ value: '<%= option.value %>', label: '<%= option.label %>' }<%= index < field.options.length - 1 ? ',' : '' %>
                  <% }) %>
                ]}
              />
            <% } else if (field.inputType === 'textarea') { %>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2"><%= field.label %></label>
                <textarea
                  value={formData.<%= field.name %> || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, <%= field.name %>: e.target.value }))}
                  className="block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent border-slate-300"
                />
                {formErrors.<%= field.name %> ? <p className="mt-1 text-sm text-red-600">{formErrors.<%= field.name %>}</p> : null}
              </div>
            <% } else { %>
              <Input
                label="<%= field.label %>"
                type="<%= field.inputType %>"
                value={formData.<%= field.name %>?.toString() || ''}
                error={formErrors.<%= field.name %>}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  <%= field.name %>: <%- field.inputType === 'number' ? 'e.target.value === "" ? undefined : Number(e.target.value)' : 'e.target.value' %>,
                }))}
              />
            <% } %>
          <% }) %>

          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditMode ? 'Update <%= entityPascal %>' : 'Create <%= entityPascal %>'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title={'Delete <%= entityPascal %>'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{itemToDelete?.id}</span>?
          </p>
          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseDeleteModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteItem}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
