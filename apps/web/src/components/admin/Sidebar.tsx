'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { menuService } from '@/services';
import type { Menu } from '@/types/api/menu';

function extractMenuTree(responseData: unknown): Menu[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const data = (responseData as any).data;
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
  }

  return [];
}

const MenuIcon = (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function isRouteActive(route: string, pathname: string) {
  return route !== '#' && (pathname === route || pathname.startsWith(`${route}/`));
}

function branchContainsActive(item: Menu, pathname: string): boolean {
  const route = item.route?.trim() || '#';
  if (isRouteActive(route, pathname)) {
    return true;
  }
  return Boolean(item.children?.some((child) => branchContainsActive(child, pathname)));
}

function MenuList({ items, pathname, depth = 0 }: { items: Menu[]; pathname: string; depth?: number }) {
  const activeId = items.find((item) => branchContainsActive(item, pathname))?.id ?? null;
  const [openId, setOpenId] = useState<number | null>(activeId);

  useEffect(() => {
    setOpenId(activeId);
  }, [activeId]);

  return (
    <>
      {items.map((item) => {
        const route = item.route?.trim() || '#';
        const hasChildren = Boolean(item.children?.length);
        const isActive = isRouteActive(route, pathname);
        const isOpen = openId === item.id;
        const paddingLeft = `${16 + depth * 16}px`;

        if (hasChildren) {
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                aria-expanded={isOpen}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                style={{ paddingLeft }}
              >
                <span className="flex items-center space-x-3 min-w-0">
                 
                  <span className="font-medium truncate">{item.name}</span>
                </span>
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen ? (
                <div className="mt-1 space-y-1">
                  <MenuList items={item.children!} pathname={pathname} depth={depth + 1} />
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            href={route}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            style={{ paddingLeft }}
            aria-current={isActive ? 'page' : undefined}
          >
          
            <span className="font-medium truncate">{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuTree() {
      setIsLoading(true);
      setError(null);

      const response = await menuService.getMenuTree(true);
      if (!isMounted) {
        return;
      }

      if (response.success && response.data) {
        const menuItems = extractMenuTree(response.data);
        setMenus(menuItems);
      } else {
        setError(response.error?.message || 'Failed to load menu tree');
      }

      setIsLoading(false);
    }

    loadMenuTree();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-white font-bold text-xl">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {isLoading ? (
          <div className="px-4 py-3 text-sm text-slate-400">Loading menu tree...</div>
        ) : error ? (
          <div className="px-4 py-3 text-sm text-rose-400">{error}</div>
        ) : menus.length > 0 ? (
          <MenuList items={menus} pathname={pathname} />
        ) : (
          <div className="px-4 py-3 text-sm text-slate-400">No active menu items found.</div>
        )}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <p className="text-xs text-slate-400 truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
