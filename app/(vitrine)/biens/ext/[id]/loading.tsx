export default function ExternalPropertyLoading() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#05080c] animate-pulse">
            {/* Hero Skeleton */}
            <div className="relative h-[50vh] min-h-[320px] max-h-[500px] w-full bg-gray-200 dark:bg-white/5">
                {/* Top Bar */}
                <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                    <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-white/10" />
                    <div className="h-10 w-40 rounded-full bg-gray-300 dark:bg-white/10" />
                </div>
                {/* Prix */}
                <div className="absolute bottom-6 left-6 z-20">
                    <div className="h-16 w-48 rounded-2xl bg-gray-300 dark:bg-white/10" />
                </div>
                <div className="absolute bottom-6 right-6 z-20">
                    <div className="h-10 w-24 rounded-full bg-gray-300 dark:bg-white/10" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="mx-auto max-w-4xl px-4 pt-8 md:px-6 space-y-6">
                {/* Breadcrumbs */}
                <div className="h-4 w-64 rounded bg-gray-200 dark:bg-white/5" />

                {/* Badges */}
                <div className="flex gap-3">
                    <div className="h-7 w-28 rounded-full bg-gray-200 dark:bg-white/5" />
                    <div className="h-7 w-36 rounded-full bg-gray-200 dark:bg-white/5" />
                </div>

                {/* Title */}
                <div className="h-10 w-3/4 rounded bg-gray-200 dark:bg-white/5" />

                {/* Location */}
                <div className="h-5 w-48 rounded bg-gray-200 dark:bg-white/5" />

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-white/5" />
                    ))}
                </div>

                {/* CTA */}
                <div className="h-16 w-full rounded-2xl bg-amber-100 dark:bg-amber-900/20" />
                <div className="h-4 w-64 mx-auto rounded bg-gray-200 dark:bg-white/5" />
            </div>
        </div>
    );
}
