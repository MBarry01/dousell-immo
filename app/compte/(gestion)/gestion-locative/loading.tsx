import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-950 py-6">
            <div className="w-full mx-auto px-4 md:px-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48 bg-slate-900" />
                    <Skeleton className="h-10 w-32 bg-slate-900" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl bg-slate-900" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl bg-slate-900" />
                    <Skeleton className="h-64 rounded-xl bg-slate-900" />
                </div>
            </div>
        </div>
    );
}
