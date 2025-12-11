/**
 * Loading state for Admin section
 */

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="animate-pulse">
        {/* Sidebar Skeleton */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
          <div className="p-6">
            <div className="h-8 w-32 bg-slate-200 rounded mb-8"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="ml-64">
          <div className="h-16 bg-white border-b border-slate-200"></div>
          <div className="p-6">
            <div className="h-8 w-48 bg-slate-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

