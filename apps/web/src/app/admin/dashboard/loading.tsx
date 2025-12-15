/**
 * Loading state for Admin Dashboard
 */

export default function DashboardLoading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-slate-200 rounded"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



