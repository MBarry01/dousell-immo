import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
    return (
        <div className="space-y-6 p-6 bg-black min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 bg-gray-800" />
                    <Skeleton className="h-4 w-32 bg-gray-800" />
                </div>
                <Skeleton className="h-12 w-48 bg-gray-800 rounded-lg" />
            </div>

            <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-10 w-16 bg-gray-800 rounded-md" />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full bg-gray-800 rounded-xl" />
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-full bg-gray-800 rounded-xl" />
                ))}
            </div>

            <Skeleton className="h-64 w-full bg-gray-800 rounded-xl mt-8" />
        </div>
    );
}
