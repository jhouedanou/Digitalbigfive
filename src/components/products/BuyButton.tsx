"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import Link from "next/link";

interface BuyButtonProps {
  resourceSlug: string;
  className?: string;
}

export default function BuyButton({ resourceSlug, className = "" }: BuyButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  async function handleClick() {
    // Check if user is logged in BEFORE making any API call
    if (authLoading) return;
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

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
        if (res.status === 401) {
          setShowLoginPrompt(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Erreur lors du paiement");
      }

      // Redirect to PayTech checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du paiement");
      setLoading(false);
    }
  }

  if (showLoginPrompt) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium mb-1">
            Connexion requise
          </p>
          <p className="text-sm text-amber-700">
            Vous devez être connecté pour effectuer un achat.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/login?callbackUrl=/produits/${resourceSlug}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href={`/inscription?callbackUrl=/produits/${resourceSlug}`}
            className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-6 rounded-lg font-semibold text-center transition-colors"
          >
            Créer un compte
          </Link>
        </div>
        <button
          onClick={() => setShowLoginPrompt(false)}
          className="text-xs text-gray-500 hover:text-gray-700 w-full text-center"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || authLoading}
        className={`bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {authLoading ? "Chargement..." : loading ? "Redirection..." : "Acheter maintenant"}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
