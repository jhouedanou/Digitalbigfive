"use client";

import { useState } from "react";

interface BuyButtonProps {
  resourceSlug: string;
  className?: string;
}

export default function BuyButton({ resourceSlug, className = "" }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: resourceSlug }),
      });

      const data = await res.json();

      if (data.requiresAuth) {
        window.location.href = `/login?redirect=/produits/${resourceSlug}&action=buy`;
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? "Chargement..." : "Acheter maintenant"}
    </button>
  );
}
