"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import { trackPixelEvent } from "@/lib/pixel";

interface BuyButtonProps {
  resourceSlug: string;
  className?: string;
}

export default function BuyButton({ resourceSlug, className = "" }: BuyButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoCheckoutDone = useRef(false);

  // Auto-checkout: si l'utilisateur est connecté et qu'un pendingCheckoutSlug existe
  useEffect(() => {
    if (authLoading || !user || autoCheckoutDone.current) return;

    const pendingSlug = sessionStorage.getItem("pendingCheckoutSlug");
    if (pendingSlug && pendingSlug === resourceSlug) {
      autoCheckoutDone.current = true;
      sessionStorage.removeItem("pendingCheckoutSlug");
      performCheckout();
    }
  }, [authLoading, user, resourceSlug]);

  async function performCheckout() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: resourceSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du paiement");
      }

      // Événement Pixel : InitiateCheckout (déduplication avec CAPI via eventId basé sur orderId)
      trackPixelEvent(
        "InitiateCheckout",
        { content_ids: [resourceSlug], num_items: 1 },
        `checkout_${data.orderId}`
      );

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du paiement");
      setLoading(false);
    }
  }

  function handleClick() {
    if (authLoading) return;

    if (user) {
      performCheckout();
      return;
    }

    // Pas connecté : sauvegarder le slug et rediriger vers login
    sessionStorage.setItem("pendingCheckoutSlug", resourceSlug);
    router.push(`/login?redirect=/produits/${resourceSlug}`);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || authLoading}
        className={`bg-[#80368D] hover:bg-[#6a2d76] text-white py-3 px-8 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {authLoading ? "Chargement..." : loading ? "Redirection..." : "Acheter maintenant"}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
