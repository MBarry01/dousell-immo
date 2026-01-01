import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <div className="min-h-screen bg-background text-white">
      <Skeleton variant="luxury" className="h-[50dvh] w-full rounded-none" />
      <div className="-mt-6 rounded-t-[32px] bg-background px-6 pb-24 pt-8 dark:bg-card">
        <div className="space-y-4">
          <Skeleton variant="luxury" className="h-6 w-3/5 rounded-full" />
          <Skeleton variant="text" className="w-2/5" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="card"
                className="h-24 rounded-2xl"
              />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`line-${index}`}
                variant="text"
                className="rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}








