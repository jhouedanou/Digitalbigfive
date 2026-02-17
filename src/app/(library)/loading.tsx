export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-[#FF9F0A]/20 border-t-[#FF9F0A] animate-spin" />
      </div>
      <p className="text-gray-500 text-sm animate-pulse">Chargement de la bibliothèque...</p>
    </div>
  );
}
