export default function BibliothequeLoading() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-screen bg-[#1c1c1e] animate-fade-in">
      {/* Top bar skeleton */}
      <div className="sticky top-0 z-20 bg-[#1c1c1e]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white/10 animate-pulse" />
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-9 w-48 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Book grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-5 w-24 bg-white/10 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="rounded-sm bg-white/5 animate-pulse"
                style={{ width: "140px", height: "200px" }}
              />
              <div className="mt-2 h-3 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Shelf */}
        <div className="h-3 rounded-sm bg-white/5 animate-pulse mt-1" />
      </div>
    </div>
  );
}
