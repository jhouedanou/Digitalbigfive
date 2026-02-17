import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-[#80368D]/20 border-t-[#80368D] animate-spin" />
      </div>
      <p className="text-gray-400 text-sm animate-pulse">Chargement...</p>
    </div>
  );
}
