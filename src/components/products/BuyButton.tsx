"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import Link from "next/link";
import PhoneInputWithCode from "@/components/shared/PhoneInputWithCode";

interface BuyButtonProps {
  resourceSlug: string;
  className?: string;
}

export default function BuyButton({ resourceSlug, className = "" }: BuyButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  async function handleClick() {
    if (authLoading) return;

    // If user is logged in, proceed directly to checkout
    if (user) {
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
            setShowRegisterForm(true);
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Erreur lors du paiement");
        }

        window.location.href = data.checkout_url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du paiement");
        setLoading(false);
      }
      return;
    }

    // If not logged in, show register form directly
    setShowRegisterForm(true);
  }

  async function handleRegisterAndCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegisterLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setRegisterLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register-and-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          password,
          phone: formData.get("phone"),
          organization: formData.get("organization"),
          resourceSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_EXISTS") {
          setError("");
          setShowRegisterForm(false);
          setShowLoginForm(true);
          setRegisterLoading(false);
          return;
        }
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Redirect to PayTech checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setRegisterLoading(false);
    }
  }

  // Registration form for non-authenticated users
  if (showRegisterForm) {
    return (
      <div className={`${className}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#80368D]/10 rounded-full mb-3">
              <svg className="w-6 h-6 text-[#80368D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Finalisez votre achat
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Créez votre compte pour procéder au paiement
            </p>
          </div>

          <form onSubmit={handleRegisterAndCheckout} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  name="firstName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  name="lastName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                placeholder="votre@email.com"
              />
            </div>

            <PhoneInputWithCode name="phone" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organisation <span className="text-gray-400 font-normal">(facultatif)</span>
              </label>
              <input
                name="organization"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                placeholder="Votre entreprise ou organisation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                placeholder="8 caractères minimum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
                placeholder="Confirmez votre mot de passe"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full bg-[#80368D] hover:bg-[#6a2d76] text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {registerLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création du compte...
                </>
              ) : (
                "Créer mon compte et acheter"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{" "}
              <button
                onClick={() => {
                  setShowRegisterForm(false);
                  setShowLoginForm(true);
                  setError("");
                }}
                className="text-[#80368D] underline font-medium hover:text-[#6a2d76]"
              >
                Se connecter
              </button>
            </p>
          </div>

          <button
            onClick={() => {
              setShowRegisterForm(false);
              setError("");
            }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full text-center block"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // Login prompt when email already exists
  if (showLoginForm) {
    return (
      <div className={`${className}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Compte existant
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Un compte existe déjà avec cet email. Connectez-vous pour finaliser votre achat.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/login?callbackUrl=/produits/${resourceSlug}`}
              className="w-full bg-[#80368D] hover:bg-[#6a2d76] text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors block"
            >
              Se connecter
            </Link>

            <button
              onClick={() => {
                setShowLoginForm(false);
                setShowRegisterForm(true);
                setError("");
              }}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-lg font-medium text-center transition-colors text-sm"
            >
              Utiliser un autre email
            </button>
          </div>

          <button
            onClick={() => {
              setShowLoginForm(false);
              setError("");
            }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 w-full text-center block"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
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
