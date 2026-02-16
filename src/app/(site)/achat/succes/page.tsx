"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">(
    "loading"
  );

  useEffect(() => {
    if (!token) {
      // No token = direct access, assume success (IPN will confirm)
      setStatus("success");
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/checkout/verify?token=${token}`);
        const data = await res.json();
        if (data.status === "success" || data.status === "paid") {
          setStatus("success");
        } else if (data.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("pending");
      }
    }

    verifyPayment();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6 animate-spin">...</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Vérification du paiement...
        </h1>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous confirmons votre paiement.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6 text-red-500">✗</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement échoué
        </h1>
        <p className="text-gray-600 mb-8">
          Le paiement n&apos;a pas pu être traité. Veuillez réessayer.
        </p>
        <Link
          href="/produits"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Retour aux produits
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6 text-yellow-500">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement en cours de traitement
        </h1>
        <p className="text-gray-600 mb-8">
          Votre paiement est en cours de confirmation. Vous recevrez un email
          dès que votre commande sera validée.
        </p>
        <Link
          href="/dashboard/produits"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Accéder à mon espace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6 text-green-500">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Merci pour votre achat !
      </h1>
      <p className="text-gray-600 mb-8">
        Votre commande a été confirmée. Vous pouvez accéder à votre produit
        depuis votre espace client.
      </p>
      <Link
        href="/dashboard/produits"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
      >
        Accéder à mes produits
      </Link>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-6">...</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Chargement...
          </h1>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
