'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Menu, MenuListParams } from '@/types/api';
import { Button, Modal, Input, Select, Checkbox } from '@/components/ui';
import { menuService } from '@/services';

interface MenuFormData {
  name: string;
  route: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
}

export default function MenuManagementPage() {
  const [filters, setFilters] = useState<MenuListParams>({
    page: 1,
    limit: 10,
    sortBy: 'sort_order',
    sortOrder: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    route: '',
    parent_id: null,
    sort_order: 1,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MenuFormData, string>>>({});

  // Fetch menus from API
  const fetchMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: MenuListParams = {
        ...filters,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await menuService.getMenus(params);

      if (response.success && response.data) {
        // response.data might be the raw backend response: { success, message, data: { data: [...], pagination: {...} } }
        // OR it might be the normalized response: { data: [...], meta: {...} }
        const menuListResponse = response.data;
        
        // Handle different response structures
        let menusArray: Menu[] = [];
        let paginationData = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };

        // Check if response.data is the raw backend response with nested structure
        // Format: { success: true, message: "...", data: { data: [...], pagination: {...} } }
        if (menuListResponse && typeof menuListResponse === 'object') {
          // Check for nested structure: response.data.data.data (array) and response.data.data.pagination
          if (menuListResponse.data && typeof menuListResponse.data === 'object' && menuListResponse.data.data && Array.isArray(menuListResponse.data.data)) {
            const backendData = menuListResponse.data;
            
            // Extract and normalize the menus array from backendData.data
            menusArray = backendData.data.map((menu: any) => ({
              id: menu.id,
              name: menu.name,
              route: menu.route || menu.slug || '',
              slug: menu.slug || menu.route?.replace(/^\//, '').replace(/\//g, '-') || '',
              description: menu.description,
              sortOrder: menu.sort_order ?? menu.sortOrder ?? 0,
              isActive: menu.is_active ?? menu.isActive ?? true,
              parentId: menu.parent_id ?? menu.parentId ?? null,
              createdAt: menu.created_at || menu.createdAt || new Date().toISOString(),
              updatedAt: menu.updated_at || menu.updatedAt || new Date().toISOString(),
            }));
            
            // Extract pagination from backendData.pagination
            const pagination = backendData.pagination || backendData.meta || {};
            paginationData = {
              page: pagination.page || filters.page || 1,
              limit: pagination.limit || filters.limit || 10,
              total: pagination.total ?? menusArray.length,
              totalPages: pagination.totalPages || pagination.total_pages || Math.ceil(menusArray.length / (pagination.limit || filters.limit || 10)),
            };
          }
          // Also check for the case where success property exists (raw backend response wrapper)
          else if (menuListResponse.success && menuListResponse.data && typeof menuListResponse.data === 'object') {
            const backendData = menuListResponse.data;
            
            if (backendData.data && Array.isArray(backendData.data)) {
              menusArray = backendData.data.map((menu: any) => ({
                id: menu.id,
                name: menu.name,
                route: menu.route || menu.slug || '',
                slug: menu.slug || menu.route?.replace(/^\//, '').replace(/\//g, '-') || '',
                description: menu.description,
                sortOrder: menu.sort_order ?? menu.sortOrder ?? 0,
                isActive: menu.is_active ?? menu.isActive ?? true,
                parentId: menu.parent_id ?? menu.parentId ?? null,
                createdAt: menu.created_at || menu.createdAt || new Date().toISOString(),
                updatedAt: menu.updated_at || menu.updatedAt || new Date().toISOString(),
              }));
              
              const pagination = backendData.pagination || backendData.meta || {};
              paginationData = {
                page: pagination.page || filters.page || 1,
                limit: pagination.limit || filters.limit || 10,
                total: pagination.total ?? menusArray.length,
                totalPages: pagination.totalPages || pagination.total_pages || Math.ceil(menusArray.length / (pagination.limit || filters.limit || 10)),
              };
            }
          }
        }
        // Check if response.data is directly an array
        else if (Array.isArray(menuListResponse)) {
          menusArray = menuListResponse;
          paginationData = {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: menusArray.length,
            totalPages: Math.ceil(menusArray.length / (filters.limit || 10)),
          };
        } 
        // Check if response.data is the normalized MenuListResponse: { data: Menu[], meta: {...} }
        else if (menuListResponse && typeof menuListResponse === 'object' && menuListResponse.data) {
          if (Array.isArray(menuListResponse.data)) {
            menusArray = menuListResponse.data;
            paginationData = {
              page: menuListResponse.meta?.page || filters.page || 1,
              limit: menuListResponse.meta?.limit || filters.limit || 10,
              total: menuListResponse.meta?.total ?? menusArray.length,
              totalPages: menuListResponse.meta?.totalPages ?? Math.ceil(menusArray.length / (menuListResponse.meta?.limit || filters.limit || 10)),
            };
          }
        }

        setMenus(menusArray);
        setPagination(paginationData);
      } else {
        setError(response.error?.message || 'Failed to fetch menus');
        setMenus([]); // Set empty array on error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setMenus([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  // Fetch menus on mount and when filters change
  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Use menus directly from API (no client-side filtering/sorting needed)
  // Ensure paginatedMenus is always an array
  const paginatedMenus = Array.isArray(menus) ? menus : [];

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchMenus();
  };

  const handleSort = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
    // fetchMenus will be called by useEffect when filters change
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    // fetchMenus will be called by useEffect when filters change
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters({ page: 1, limit: 10, sortBy: 'sort_order', sortOrder: 'ASC' });
    // fetchMenus will be called by useEffect when filters change
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingMenuId(null);
    setIsModalOpen(true);
    setFormData({
      name: '',
      route: '',
      parent_id: null,
      sort_order: Math.max(...menus.map((m) => m.sortOrder), 0) + 1,
      is_active: true,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleEditMenu = (menu: Menu) => {
    setIsEditMode(true);
    setEditingMenuId(menu.id);
    setIsModalOpen(true);
    setFormData({
      name: menu.name,
      route: menu.route || '',
      parent_id: menu.parentId ?? null,
      sort_order: menu.sortOrder,
      is_active: menu.isActive,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingMenuId(null);
    setFormData({
      name: '',
      route: '',
      parent_id: null,
      sort_order: 1,
      is_active: true,
    });
    setFormErrors({});
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof MenuFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.route.trim()) {
      errors.route = 'Route is required';
    } else if (!formData.route.startsWith('/')) {
      errors.route = 'Route must start with /';
    }

    if (formData.sort_order < 1) {
      errors.sort_order = 'Sort order must be at least 1';
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
      if (isEditMode && editingMenuId !== null) {
        // Update existing menu
        const response = await menuService.updateMenu(editingMenuId, {
          name: formData.name.trim(),
          route: formData.route.trim(),
          parent_id: formData.parent_id,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        });

        if (response.success && response.data) {
          handleCloseModal();
          // Refresh the menu list from API
          await fetchMenus();
        } else {
          setSubmitError(response.error?.message || 'Failed to update menu');
        }
      } else {
        // Create new menu
        const response = await menuService.createMenu({
          name: formData.name.trim(),
          route: formData.route.trim(),
          parent_id: formData.parent_id,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        });

        if (response.success && response.data) {
          // Add the new menu to the list
          // The API might return the menu in different formats, handle both
          let newMenu: Menu;
          
          // Handle different response formats
          if (response.data.id !== undefined) {
            // Direct Menu object
            newMenu = {
              id: response.data.id,
              name: response.data.name || formData.name.trim(),
              slug: response.data.slug || formData.route.replace(/^\//, '').replace(/\//g, '-'),
              route: response.data.route || formData.route.trim(),
              description: response.data.description,
              sortOrder: response.data.sortOrder ?? response.data.sort_order ?? formData.sort_order,
              isActive: response.data.isActive ?? response.data.is_active ?? formData.is_active,
              parentId: response.data.parentId ?? response.data.parent_id ?? formData.parent_id ?? null,
              createdAt: response.data.createdAt || response.data.created_at || new Date().toISOString(),
              updatedAt: response.data.updatedAt || response.data.updated_at || new Date().toISOString(),
            };
          } else {
            // Fallback: create menu from form data
            const slug = formData.route.replace(/^\//, '').replace(/\//g, '-') || formData.name.toLowerCase().replace(/\s+/g, '-');
            newMenu = {
              id: Math.max(...menus.map((m) => m.id), 0) + 1,
              name: formData.name.trim(),
              slug,
              route: formData.route.trim(),
              description: undefined,
              sortOrder: formData.sort_order,
              isActive: formData.is_active,
              parentId: formData.parent_id ?? null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          
          // Ensure the new menu has all required fields before adding
          if (newMenu && newMenu.id !== undefined && newMenu.id !== null && newMenu.name) {
            // Ensure parentId is properly set (null or number, never undefined)
            newMenu.parentId = newMenu.parentId ?? null;
            handleCloseModal();
            // Refresh the menu list from API
            await fetchMenus();
          } else {
            setSubmitError('Invalid menu data received from server');
          }
        } else {
          // Handle API error
          setSubmitError(response.error?.message || 'Failed to create menu');
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get parent menu options (only top-level menus can be parents, exclude current menu if editing)
  const parentMenuOptions = useMemo(() => {
    // Ensure menus is an array
    if (!Array.isArray(menus)) {
      return [{ value: '', label: 'None (Top Level)' }];
    }
    
    const topLevelMenus = menus.filter((m) => 
      m && 
      m.id !== undefined && 
      !m.parentId && 
      m.id !== editingMenuId // Exclude current menu if editing to prevent circular reference
    );
    return [
      { value: '', label: 'None (Top Level)' },
      ...topLevelMenus
        .filter((menu) => menu && menu.id !== undefined && menu.id !== null)
        .map((menu) => ({
          value: String(menu.id),
          label: menu.name || 'Unnamed Menu',
        })),
    ];
  }, [menus, editingMenuId]);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu Management
              </h1>
              <p className="text-slate-600 mt-1">Manage your application menus and navigation items</p>
            </div>
            <Button 
              variant="primary" 
              onClick={handleOpenModal}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Menu
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
                placeholder="Search menus by name or route..."
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
                  <p className="text-sm font-medium text-slate-600">Total Menus</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Menus</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {paginatedMenus.filter(m => m.isActive).length}
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
                  <p className="text-sm font-medium text-slate-600">Inactive Menus</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {paginatedMenus.filter(m => !m.isActive).length}
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

        {/* Menu Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading menus...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Error Loading Menus</p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : !Array.isArray(paginatedMenus) || paginatedMenus.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No menus found</p>
              <p className="text-slate-600 mb-6">Get started by creating your first menu item</p>
              <Button variant="primary" onClick={handleOpenModal}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Menu
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
                        Route
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('sort_order')}
                          className="flex items-center space-x-2 hover:text-purple-600 transition-colors"
                        >
                          <span>Sort Order</span>
                          {getSortIcon('sort_order')}
                        </button>
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
                    {Array.isArray(paginatedMenus) && paginatedMenus.map((menu) => (
                      <tr 
                        key={menu.id} 
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900">#{menu.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {menu.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{menu.name}</div>
                              {menu.description && (
                                <div className="text-xs text-slate-500 mt-0.5">{menu.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-3 py-1.5 bg-slate-100 text-purple-700 rounded-md text-xs font-mono font-medium border border-slate-200">
                            {menu.route || menu.slug || '-'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {menu.sortOrder}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(menu.isActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleEditMenu(menu)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                              title="Edit menu"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              title="Delete menu"
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

      {/* Add/Edit Menu Modal */}
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
            <span>{isEditMode ? 'Edit Menu' : 'Add New Menu'}</span>
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
            placeholder="Enter menu name"
            error={formErrors.name}
            required
          />

          <Input
            label="Route"
            type="text"
            value={formData.route}
            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
            placeholder="/example-page"
            error={formErrors.route}
            helperText="Route must start with /"
            required
          />

          <Select
            label="Parent Menu"
            value={formData.parent_id != null ? String(formData.parent_id) : ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                parent_id: e.target.value && e.target.value !== '' ? parseInt(e.target.value) : null,
              })
            }
            options={parentMenuOptions}
            helperText="Select a parent menu or leave as 'None' for top-level menu"
          />

          <Input
            label="Sort Order"
            type="number"
            min="1"
            value={formData.sort_order}
            onChange={(e) =>
              setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })
            }
            error={formErrors.sort_order}
            helperText="Lower numbers appear first"
            required
          />

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
              {isEditMode ? 'Update Menu' : 'Add Menu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
