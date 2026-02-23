"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";
import DownloadPrompt from "@/components/library/DownloadPrompt";
import { Download, BookOpen, ArrowRight } from "lucide-react";

interface OrderDetails {
  orderId: string;
  productTitle: string;
  productId: string;
  coverImage?: string;
  amount: number;
  currency: string;
  date: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  // PayTech peut envoyer le token sous différents noms selon la version
  const token = searchParams.get("token") || searchParams.get("token_payment") || searchParams.get("ref");
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">(
    "loading"
  );
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  // État pour la connexion rapide des nouveaux utilisateurs
  const [newUserEmail, setNewUserEmail] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // État pour le polling
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 12; // 12 × 3s = 36 secondes max

  useEffect(() => {
    // Vérifier si c'est un nouvel utilisateur créé lors du paiement (fallback connexion)
    const stored = sessionStorage.getItem("newUserAfterPayment");
    if (stored) {
      try {
        const { email } = JSON.parse(stored);
        // N'afficher le formulaire de connexion que si Supabase ne nous a pas connecté
        const supabase = createClient();
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            // Pas de session active → afficher le formulaire de connexion rapide
            if (email) setNewUserEmail(email);
          } else {
            // Déjà connecté → nettoyer le sessionStorage
            sessionStorage.removeItem("newUserAfterPayment");
          }
        });
      } catch { /* ignore */ }
    }

    let attempts = 0;
    let pollTimer: ReturnType<typeof setTimeout>;

    async function verifyPayment() {
      try {
        // PayTech passe le token dans l'URL → on vérifie d'abord par token
        // Sinon fallback sur la dernière commande de l'utilisateur connecté
        const url = token
          ? `/api/checkout/verify?token=${token}`
          : `/api/checkout/verify-latest`;

        const res = await fetch(url);

        if (!res.ok) {
          // 401 = non connecté, 5xx = erreur serveur → continuer à poller
          scheduleRetry();
          return;
        }

        const data = await res.json();

        if (data.status === "success" || data.status === "paid") {
          setStatus("success");
          if (data.order) {
            setOrderDetails(data.order);
            setTimeout(() => setShowDownloadPrompt(true), 1000);
          }
        } else if (data.status === "failed") {
          setStatus("failed");
        } else {
          // pending / not_found / error → PayTech IPN pas encore reçu, on repoll
          if (data.order) setOrderDetails(data.order);
          scheduleRetry();
        }
      } catch {
        scheduleRetry();
      }
    }

    function scheduleRetry() {
      attempts += 1;
      setPollCount(attempts);
      if (attempts < MAX_POLLS) {
        // Backoff progressif : 3s les 4 premières fois, puis 5s
        const delay = attempts < 4 ? 3000 : 5000;
        pollTimer = setTimeout(verifyPayment, delay);
      } else {
        // Après 36s sans confirmation → afficher "en attente"
        setStatus("pending");
      }
    }

    verifyPayment();

    return () => clearTimeout(pollTimer);
  }, [token]);

  // Connexion rapide pour les nouveaux utilisateurs après paiement
  async function handleQuickLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail || !loginPassword) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: newUserEmail,
        password: loginPassword,
      });
      if (error) {
        setLoginError("Mot de passe incorrect. Veuillez réessayer.");
        setLoginLoading(false);
        return;
      }
      // Connexion réussie : nettoyer sessionStorage et recharger
      sessionStorage.removeItem("newUserAfterPayment");
      setLoginSuccess(true);
      setLoginLoading(false);
      // Recharger la page pour que la session soit prise en compte
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setLoginError("Erreur de connexion. Veuillez réessayer.");
      setLoginLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-4 border-[#80368D] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Confirmation du paiement...
        </h1>
        <p className="text-gray-600 mb-3">
          Nous attendons la confirmation de PayTech.
        </p>
        {pollCount > 0 && (
          <p className="text-sm text-gray-400">
            Vérification {pollCount}/{MAX_POLLS}...
          </p>
        )}
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

        {/* Connexion rapide pour les nouveaux utilisateurs */}
        {newUserEmail && !loginSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-base font-semibold text-blue-900 mb-1">
              🎉 Votre compte a été créé !
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Connectez-vous dès maintenant pour accéder à votre contenu dès que le paiement sera confirmé.
            </p>
            <form onSubmit={handleQuickLogin} className="space-y-3">
              <input
                type="email"
                value={newUserEmail}
                readOnly
                title="Email"
                aria-label="Email du compte créé"
                className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-blue-100 text-blue-800 cursor-not-allowed"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
              />
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading || !loginPassword}
                className="w-full bg-[#80368D] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#6a2d76] disabled:opacity-50"
              >
                {loginLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        )}

        {loginSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 font-medium">✅ Connecté ! Rechargement en cours...</p>
          </div>
        )}

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
        <button
          onClick={() => setShowDownloadPrompt(true)}
          className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Télécharger pour lire hors ligne
        </button>
        <Link
          href="/dashboard/bibliotheque"
          className="flex-1 bg-[#80368D] text-white text-center px-6 py-4 rounded-lg font-semibold hover:bg-[#6a2d76] transition-colors flex items-center justify-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Ma bibliothèque
        </Link>
      </div>

      {/* Connexion rapide si nouvel utilisateur non connecté */}
      {newUserEmail && !loginSuccess && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-blue-900 mb-1">
            🔐 Connectez-vous pour accéder à votre contenu
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Votre compte a été créé avec l&apos;email <strong>{newUserEmail}</strong>. Entrez votre mot de passe pour y accéder.
          </p>
          <form onSubmit={handleQuickLogin} className="space-y-3">
            <input
              type="email"
              value={newUserEmail}
              readOnly
              title="Email"
              aria-label="Email du compte créé"
              className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-blue-100 text-blue-800 cursor-not-allowed"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
            />
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !loginPassword}
              className="w-full bg-[#80368D] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#6a2d76] disabled:opacity-50"
            >
              {loginLoading ? "Connexion..." : "Se connecter et accéder à ma bibliothèque"}
            </button>
          </form>
          {loginSuccess && (
            <p className="text-green-700 font-medium mt-3">✅ Connecté ! Rechargement en cours...</p>
          )}
        </div>
      )}

      {/* Quick Access */}
      <div className="mt-6 text-center">
        <Link
          href="/dashboard/historique"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-[#80368D] transition-colors"
        >
          Voir mes reçus
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Download Prompt Modal */}
      {orderDetails && (
        <DownloadPrompt
          isOpen={showDownloadPrompt}
          onClose={() => setShowDownloadPrompt(false)}
          product={{
            id: orderDetails.productId,
            title: orderDetails.productTitle,
            coverImage: orderDetails.coverImage,
          }}
          onDownloadComplete={() => {
            setShowDownloadPrompt(false);
          }}
        />
      )}
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
