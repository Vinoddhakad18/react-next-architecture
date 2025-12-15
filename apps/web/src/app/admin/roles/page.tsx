'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Role, RoleListParams } from '@/types/api';
import { Button, Modal, Input, Checkbox } from '@/components/ui';
import { roleService } from '@/services';

interface RoleFormData {
  name: string;
  description: string;
  is_active: boolean;
}

export default function RoleManagementPage() {
  const [filters, setFilters] = useState<RoleListParams>({
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: RoleListParams = {
        ...filters,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await roleService.getRoles(params);

      if (response.success && response.data) {
        const roleListResponse = response.data;
        
        let rolesArray: Role[] = [];
        let paginationData = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };

        // Handle different response structures
        if (roleListResponse && typeof roleListResponse === 'object') {
          // Check for nested structure: response.data.data (array) and response.data.pagination
          if (roleListResponse.data && typeof roleListResponse.data === 'object' && roleListResponse.data.data && Array.isArray(roleListResponse.data.data)) {
            const backendData = roleListResponse.data;
            
            rolesArray = backendData.data.map((role: any) => ({
              id: role.id,
              name: role.name,
              description: role.description,
              isActive: role.status ?? role.is_active ?? role.isActive ?? true,
              createdAt: role.created_at || role.createdAt || new Date().toISOString(),
              updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
            }));
            
            const pagination = backendData.pagination || backendData.meta || {};
            paginationData = {
              page: pagination.page || filters.page || 1,
              limit: pagination.limit || filters.limit || 10,
              total: pagination.total ?? rolesArray.length,
              totalPages: pagination.totalPages || pagination.total_pages || Math.ceil(rolesArray.length / (pagination.limit || filters.limit || 10)),
            };
          } else if (roleListResponse.success && roleListResponse.data && typeof roleListResponse.data === 'object') {
            const backendData = roleListResponse.data;
            
            if (backendData.data && Array.isArray(backendData.data)) {
              rolesArray = backendData.data.map((role: any) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                isActive: role.status ?? role.is_active ?? role.isActive ?? true,
                createdAt: role.created_at || role.createdAt || new Date().toISOString(),
                updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
              }));
              
              const pagination = backendData.pagination || backendData.meta || {};
              paginationData = {
                page: pagination.page || filters.page || 1,
                limit: pagination.limit || filters.limit || 10,
                total: pagination.total ?? rolesArray.length,
                totalPages: pagination.totalPages || pagination.total_pages || Math.ceil(rolesArray.length / (pagination.limit || filters.limit || 10)),
              };
            }
          }
        } else if (Array.isArray(roleListResponse)) {
          rolesArray = roleListResponse.map((role: any) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.status ?? role.is_active ?? role.isActive ?? true,
            createdAt: role.created_at || role.createdAt || new Date().toISOString(),
            updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
          }));
          paginationData = {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: rolesArray.length,
            totalPages: Math.ceil(rolesArray.length / (filters.limit || 10)),
          };
        } else if (roleListResponse && typeof roleListResponse === 'object' && roleListResponse.data) {
          if (Array.isArray(roleListResponse.data)) {
            rolesArray = roleListResponse.data.map((role: any) => ({
              id: role.id,
              name: role.name,
              description: role.description,
              isActive: role.status ?? role.is_active ?? role.isActive ?? true,
              createdAt: role.created_at || role.createdAt || new Date().toISOString(),
              updatedAt: role.updated_at || role.updatedAt || new Date().toISOString(),
            }));
            paginationData = {
              page: roleListResponse.meta?.page || filters.page || 1,
              limit: roleListResponse.meta?.limit || filters.limit || 10,
              total: roleListResponse.meta?.total ?? rolesArray.length,
              totalPages: roleListResponse.meta?.totalPages ?? Math.ceil(rolesArray.length / (roleListResponse.meta?.limit || filters.limit || 10)),
            };
          }
        }

        setRoles(rolesArray);
        setPagination(paginationData);
      } else {
        setError(response.error?.message || 'Failed to fetch roles');
        setRoles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  // Fetch roles on mount and when filters change
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const paginatedRoles = Array.isArray(roles) ? roles : [];

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
    setFilters({ page: 1, limit: 10, sortBy: 'id', sortOrder: 'ASC' });
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingRoleId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleEditRole = (role: Role) => {
    setIsEditMode(true);
    setEditingRoleId(role.id);
    setIsModalOpen(true);
    setFormData({
      name: role.name,
      description: role.description || '',
      is_active: role.isActive,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingRoleId(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setDeletingRoleId(roleToDelete.id);
    setError(null);

    try {
      const result = await roleService.deleteRole(roleToDelete.id);

      if (!result.success || result.error) {
        setError(result.error?.message || 'Failed to delete role');
        setDeletingRoleId(null);
        return;
      }

      // Refresh the roles list
      await fetchRoles();
      handleCloseDeleteModal();
      setDeletingRoleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setDeletingRoleId(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof RoleFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
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
      if (isEditMode && editingRoleId !== null) {
        // Update existing role
        const result = await roleService.updateRole(editingRoleId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          status: formData.is_active,
        });

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to update role');
          setIsSubmitting(false);
          return;
        }

        // Refresh the roles list
        await fetchRoles();
        handleCloseModal();
      } else {
        // Create new role
        const result = await roleService.createRole({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          status: formData.is_active,
        });

        if (!result.success || result.error) {
          setSubmitError(result.error?.message || 'Failed to create role');
          setIsSubmitting(false);
          return;
        }

        // Refresh the roles list
        await fetchRoles();
        handleCloseModal();
      }
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Role Management
              </h1>
              <p className="text-slate-600 mt-1">Manage user roles</p>
            </div>
            <Button 
              variant="primary" 
              onClick={handleOpenModal}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Role
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
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
                placeholder="Search roles by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleSearch}
                className="px-6"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="px-6"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Roles</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Roles</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {paginatedRoles.filter(r => r.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Inactive Roles</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {paginatedRoles.filter(r => !r.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading roles...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Error Loading Roles</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : !Array.isArray(paginatedRoles) || paginatedRoles.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No roles found</p>
              <p className="text-slate-600 mb-6">Get started by creating your first role</p>
              <Button variant="primary" onClick={handleOpenModal}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Role
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('id')}
                          className="flex items-center space-x-2 hover:text-purple-600 transition-colors"
                        >
                          <span>ID</span>
                          {getSortIcon('id')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center space-x-2 hover:text-purple-600 transition-colors"
                        >
                          <span>Name</span>
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Description
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
                    {Array.isArray(paginatedRoles) && paginatedRoles.map((role) => (
                      <tr 
                        key={role.id} 
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900">#{role.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {role.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{role.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 max-w-xs truncate">
                            {role.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(role.isActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleEditRole(role)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                              title="Edit role"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(role)}
                              disabled={deletingRoleId === role.id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete role"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{pagination.total}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              pagination.page === pageNum
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${isEditMode ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {isEditMode ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <span>{isEditMode ? 'Edit Role' : 'Add New Role'}</span>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter role name"
            error={formErrors.name}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter role description"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <Checkbox
            label="Is Active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />

          {submitError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{submitError}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-5 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              {isEditMode ? 'Update Role' : 'Add Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-900">Delete Role</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-slate-700 font-medium mb-2">
                Are you sure you want to delete this role?
              </p>
              {roleToDelete && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-900">{roleToDelete.name}</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-red-600 font-medium mt-3">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteModal}
              disabled={deletingRoleId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteRole}
              isLoading={deletingRoleId !== null}
              disabled={deletingRoleId !== null}
            >
              {deletingRoleId !== null ? 'Deleting...' : 'Delete Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



