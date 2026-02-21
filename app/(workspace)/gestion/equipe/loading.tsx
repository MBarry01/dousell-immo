import { KPICardSkeleton, ListSkeleton } from "../components/PremiumSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg opacity-60" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* Members skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}
