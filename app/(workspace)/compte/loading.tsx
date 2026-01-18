import { Skeleton } from "@/components/ui/skeleton";

export default function CompteLoading() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <Skeleton variant="luxury" className="h-12 w-80 rounded-full" />
          <Skeleton variant="text" className="h-5 w-96" />
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`stat-${index}`}
              variant="card"
              className="h-32 rounded-2xl"
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Section - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Properties Section */}
            <div className="space-y-4">
              <Skeleton variant="luxury" className="h-8 w-48 rounded-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`property-${index}`} className="space-y-3">
                    <Skeleton variant="card" className="aspect-[4/3] rounded-2xl" />
                    <Skeleton variant="luxury" className="h-5 w-3/4" />
                    <Skeleton variant="text" className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Section */}
            <div className="space-y-4">
              <Skeleton variant="luxury" className="h-8 w-64 rounded-full" />
              <Skeleton variant="card" className="h-64 rounded-2xl" />
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Skeleton variant="card" className="h-80 rounded-2xl" />

            {/* Quick Actions */}
            <div className="space-y-3">
              <Skeleton variant="luxury" className="h-6 w-40 rounded-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={`action-${index}`}
                  variant="luxury"
                  className="h-12 rounded-xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
