"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import { trackPixelEvent } from "@/lib/pixel";

type PaymentGateway = "paytech" | "moneroo";

interface BuyButtonProps {
  resourceSlug: string;
  className?: string;
}

export default function BuyButton({ resourceSlug, className = "" }: BuyButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gateway, setGateway] = useState<PaymentGateway>("moneroo");
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);
  const autoCheckoutDone = useRef(false);

  // Auto-checkout: si l'utilisateur est connecté et qu'un pendingCheckoutSlug existe
  useEffect(() => {
    if (authLoading || !user || autoCheckoutDone.current) return;

    const pendingSlug = sessionStorage.getItem("pendingCheckoutSlug");
    if (pendingSlug && pendingSlug === resourceSlug) {
      autoCheckoutDone.current = true;
      sessionStorage.removeItem("pendingCheckoutSlug");
      // Récupérer le gateway sauvegardé
      const savedGateway = sessionStorage.getItem("pendingCheckoutGateway") as PaymentGateway | null;
      sessionStorage.removeItem("pendingCheckoutGateway");
      performCheckout(savedGateway || gateway);
    }
  }, [authLoading, user, resourceSlug]);

  async function performCheckout(selectedGateway: PaymentGateway = gateway) {
    setLoading(true);
    setError("");

    const checkoutUrl = selectedGateway === "moneroo" ? "/api/checkout/moneroo" : "/api/checkout";

    try {
      const res = await fetch(checkoutUrl, {
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
    if (authLoading || loading) return;

    if (user) {
      setShowGatewayPicker(true);
      return;
    }

    // Pas connecté : sauvegarder le slug et le gateway, puis rediriger vers login
    sessionStorage.setItem("pendingCheckoutSlug", resourceSlug);
    sessionStorage.setItem("pendingCheckoutGateway", gateway);
    router.push(`/login?redirect=/produits/${resourceSlug}`);
  }

  function handleGatewaySelect(selectedGateway: PaymentGateway) {
    setGateway(selectedGateway);
    setShowGatewayPicker(false);
    performCheckout(selectedGateway);
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading || authLoading}
        className={`bg-[#80368D] hover:bg-[#6a2d76] text-white py-3 px-8 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {authLoading ? "Chargement..." : loading ? "Redirection..." : "Acheter maintenant"}
      </button>

      {/* Modal de sélection du moyen de paiement */}
      {showGatewayPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">
              Choisissez votre moyen de paiement
            </h3>
            <p className="text-sm text-gray-500 mb-5 text-center">
              Sélectionnez comment vous souhaitez payer
            </p>

            <div className="space-y-3">
              {/* Moneroo — Mobile Money, Cartes, etc. */}
              <button
                onClick={() => handleGatewaySelect("moneroo")}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#80368D] hover:bg-purple-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-[#80368D]">Mobile Money & Cartes</span>
                  <p className="text-xs text-gray-500 mt-0.5">Wave, Orange Money, MTN, Visa, Mastercard…</p>
                </div>
              </button>

              {/* PayTech — Paiement local Sénégal */}
              <button
                onClick={() => handleGatewaySelect("paytech")}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#80368D] hover:bg-purple-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-[#80368D]">PayTech</span>
                  <p className="text-xs text-gray-500 mt-0.5">Paiement local sécurisé</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowGatewayPicker(false)}
              className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
