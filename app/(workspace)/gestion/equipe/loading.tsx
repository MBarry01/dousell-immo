export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-800 rounded" />
              <div className="h-4 w-64 bg-slate-800 rounded" />
              <div className="h-4 w-32 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-slate-800 rounded-lg" />
            <div className="h-10 w-32 bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-800/50">
              <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
              <div className="h-8 w-12 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Members skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-slate-800 rounded" />
                  <div className="h-6 w-24 bg-slate-800 rounded-full" />
                  <div className="h-3 w-40 bg-slate-800 rounded" />
                  <div className="h-3 w-28 bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
