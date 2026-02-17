export default function ReaderLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#80368D]/20 border-t-[#80368D] animate-spin" />
        <svg
          className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white font-medium mb-1">Ouverture du livre...</p>
        <p className="text-gray-500 text-sm">Préparation des pages</p>
      </div>
    </div>
  );
}
