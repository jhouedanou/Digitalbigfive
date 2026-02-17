export default function ProductsLoading() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 w-56 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-10 bg-[#80368D]/10 rounded-lg animate-pulse flex-1" />
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
