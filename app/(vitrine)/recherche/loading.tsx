import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 space-y-3">
          <Skeleton variant="luxury" className="h-10 w-64 rounded-full" />
          <Skeleton variant="text" className="h-5 w-96" />
        </div>

        {/* Filters Section */}
        <div className="mb-6 flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={`filter-${index}`}
              variant="luxury"
              className="h-10 w-32 rounded-full"
            />
          ))}
        </div>

        {/* Results Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={`property-${index}`} className="space-y-3">
              {/* Image */}
              <Skeleton variant="card" className="aspect-[4/3] w-full rounded-2xl" />

              {/* Title */}
              <Skeleton variant="luxury" className="h-6 w-3/4 rounded-full" />

              {/* Location */}
              <Skeleton variant="text" className="h-4 w-1/2" />

              {/* Price */}
              <Skeleton variant="luxury" className="h-8 w-32 rounded-full" />

              {/* Features */}
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={`feature-${index}-${i}`}
                    variant="text"
                    className="h-4 w-16"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
