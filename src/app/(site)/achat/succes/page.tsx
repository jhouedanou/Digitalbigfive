"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface OrderDetails {
  orderId: string;
  productTitle: string;
  amount: number;
  currency: string;
  date: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">(
    "loading"
  );
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Essayer de vérifier avec le token PayTech
        const url = token 
          ? `/api/checkout/verify?token=${token}`
          : `/api/checkout/verify-latest`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === "success" || data.status === "paid") {
          setStatus("success");
          if (data.order) {
            setOrderDetails(data.order);
          }
        } else if (data.status === "pending") {
          setStatus("pending");
          if (data.order) {
            setOrderDetails(data.order);
          }
        } else {
          setStatus("failed");
        }
      } catch {
        // En cas d'erreur, afficher pending
        setStatus("pending");
      }
    }

    verifyPayment();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-4 border-[#80368D] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
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
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement échoué
        </h1>
        <p className="text-gray-600 mb-8">
          Le paiement n&apos;a pas pu être traité. Veuillez réessayer.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#80368D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6a2d76]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement en cours de traitement
        </h1>
        <p className="text-gray-600 mb-8">
          Votre paiement est en cours de confirmation. Vous recevrez un email
          dès que votre commande sera validée.
        </p>
        <Link
          href="/dashboard/produits"
          className="inline-block bg-[#80368D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6a2d76]"
        >
          Accéder à mon espace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Merci pour votre achat !
        </h1>
        <p className="text-gray-600">
          Votre commande a été confirmée avec succès.
        </p>
      </div>

      {/* Receipt Card */}
      {orderDetails && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Reçu de paiement</h2>
            <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
              Payé
            </span>
          </div>
          
          <div className="border-t border-b border-gray-100 py-6 mb-6">
            <div className="flex justify-between mb-4">
              <span className="text-gray-500">Produit</span>
              <span className="font-medium text-gray-900">{orderDetails.productTitle}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-500">N° de commande</span>
              <span className="font-mono text-sm text-gray-700">{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-700">{orderDetails.date}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-[#80368D]">
              {orderDetails.amount.toLocaleString()} {orderDetails.currency}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/produits"
          className="flex-1 bg-[#80368D] text-white text-center px-6 py-4 rounded-lg font-semibold hover:bg-[#6a2d76] transition-colors"
        >
          Accéder à mes produits
        </Link>
        <Link
          href="/dashboard/historique"
          className="flex-1 border border-gray-300 text-gray-700 text-center px-6 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Voir mes reçus
        </Link>
      </div>
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
