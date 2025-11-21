"use client";

export default function PropertyLoading() {
  return (
    <div className="min-h-screen bg-[#05080c] text-white">
      <div className="h-[50vh] w-full animate-pulse bg-white/10" />
      <div className="-mt-6 rounded-t-[32px] bg-white px-6 pb-24 pt-8 dark:bg-[#080b11]">
        <div className="space-y-4">
          <div className="h-6 w-3/5 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`line-${index}`}
                className="h-4 animate-pulse rounded-full bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}







