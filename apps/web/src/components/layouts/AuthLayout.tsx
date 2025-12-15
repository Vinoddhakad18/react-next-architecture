/**
 * Auth Layout Component
 * Layout for authentication pages (login, register, etc.)
 */

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="relative w-full max-w-md px-6">
        {children}
      </div>
    </div>
  );
}



