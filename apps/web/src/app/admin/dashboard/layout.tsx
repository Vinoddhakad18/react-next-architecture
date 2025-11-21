import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
