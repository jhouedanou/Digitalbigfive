"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DirectDownloadButtonProps {
  resourceId: string;
  resourceTitle: string;
  resourceCategory?: string;
  showUpsellAfterDownload?: boolean;
}

export default function DirectDownloadButton({ 
  resourceId, 
  resourceTitle,
  resourceCategory,
  showUpsellAfterDownload = true,
}: DirectDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDownload() {
    setLoading(true);
    
    try {
      // Générer un token de téléchargement direct
      const res = await fetch("/api/download/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la préparation du téléchargement");
      }

      const data = await res.json();
      
      // Ouvrir le PDF dans un nouvel onglet
      window.open(data.downloadUrl, "_blank");

      // Redirect to thank you page with upsell after a short delay
      if (showUpsellAfterDownload) {
        setTimeout(() => {
          const params = new URLSearchParams();
          if (resourceCategory) params.set("category", resourceCategory);
          if (resourceId) params.set("resourceId", resourceId);
          router.push(`/ressources/merci?${params.toString()}`);
        }, 500);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full bg-gradient-to-r from-[#80368D] to-[#29358B] text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Préparation...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Télécharger gratuitement
        </>
      )}
    </button>
  );
}
