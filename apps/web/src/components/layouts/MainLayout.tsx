/**
 * Main Layout Component
 * Base layout for authenticated pages
 */

import { ReactNode } from 'react';
import { Header } from '@/components/admin/Header';
import { Sidebar } from '@/components/admin/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}



