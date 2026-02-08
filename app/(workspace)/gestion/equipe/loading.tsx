import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Skeleton className="h-[280px] w-full rounded-2xl" variant="luxury" />

      {/* Members skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 rounded" variant="luxury" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" variant="luxury" />
          ))}
        </div>
      </div>
    </div>
  );
}
