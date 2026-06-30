'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type {
  Product,
  ProductListParams,
  UpdateProductRequest,
} from '@/types/api/product';
import { Button, Checkbox, Input, Modal, Select } from '@/components/ui';
import { productService } from '@/services';

export default function ProductsManagementPage() {
  const [filters, setFilters] = useState<ProductListParams>({
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Product[]>([]);
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
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UpdateProductRequest, string>>>({});
  const [formData, setFormData] = useState<UpdateProductRequest>({
    name: '',
    price: 0,
    status: ''
    
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ProductListParams = {
        ...filters,
        ...(searchTerm ? { search: searchTerm } : {}),
      };
      const response = await productService.getProducts(params);

      if (response.success && response.data) {
        const payload = response.data as unknown as { data?: unknown; meta?: any };
        const normalized = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setItems(normalized as Product[]);
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
      name: '',
      price: 0,
      status: ''
      
    });
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Product) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      name: item.name as any,
      price: item.price as any,
      status: item.status as any
      
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

  const handleDeleteClick = (item: Product) => {
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
    const errors: Partial<Record<keyof UpdateProductRequest, string>> = {};

    
    const nameValue = formData.name;
    
    if (nameValue === undefined || nameValue === null || nameValue.toString().trim() === '') {
      errors.name = 'Name is required';
    }
    
    
    const priceValue = formData.price;
    
    if (priceValue === undefined || priceValue === null || priceValue.toString().trim() === '') {
      errors.price = 'Price is required';
    }
    
    
    const statusValue = formData.status;
    
    if (statusValue === undefined || statusValue === null || statusValue.toString().trim() === '') {
      errors.status = 'Status is required';
    }
    
    

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
        name: formData.name,
        price: formData.price,
        status: formData.status
        
      };

      const response = isEditMode && editingItem
        ? await productService.updateProduct(editingItem.id as string, payload)
        : await productService.createProduct(payload);

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
      const response = await productService.deleteProduct(itemToDelete.id as string);

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
          <h1 className="text-2xl font-semibold text-slate-900">Product Management</h1>
          <p className="mt-1 text-sm text-slate-500">View, create, update, and delete products.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products"
            className="min-w-[240px]"
          />
          <Button onClick={handleSearch} variant="secondary">Search</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
          <Button onClick={handleOpenCreateModal} variant="primary">Add Product</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-medium text-slate-700">Product list</div>
          <div className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages || 1}</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading products...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-rose-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-700">Name</th><th className="px-6 py-3 font-medium text-slate-700">Price</th><th className="px-6 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    
                    <td className="px-6 py-4 text-slate-700">
                      {typeof item.name === 'boolean' ? (item.name ? 'Yes' : 'No') : item.name}
                    </td>
                    
                    <td className="px-6 py-4 text-slate-700">
                      {typeof item.price === 'boolean' ? (item.price ? 'Yes' : 'No') : item.price}
                    </td>
                    
                    <td className="px-6 py-4 text-slate-700">
                      {typeof item.status === 'boolean' ? (item.status ? 'Yes' : 'No') : item.status}
                    </td>
                    
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
            <span className="font-semibold text-slate-900">{pagination.total}</span> products
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? 'Edit Product' : 'Add Product'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          
            
              <Input
                label="Name"
                type="text"
                value={formData.name?.toString() || ''}
                error={formErrors.name}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))}
              />
            
          
            
              <Input
                label="Price"
                type="number"
                value={formData.price?.toString() || ''}
                error={formErrors.price}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  price: e.target.value === "" ? undefined : Number(e.target.value),
                }))}
              />
            
          
            
              <Select
                label="Status"
                value={formData.status || ''}
                error={formErrors.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                  
                ]}
              />
            
          

          {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title={'Delete Product'} size="sm">
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
