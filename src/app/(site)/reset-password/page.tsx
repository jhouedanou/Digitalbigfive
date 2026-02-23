"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold text-[#29358B] mb-2 text-center">
        Mot de passe oublié
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Entrez votre adresse email pour recevoir un lien de réinitialisation
      </p>

      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-700 font-medium mb-2">Email envoyé !</p>
          <p className="text-sm text-green-600">
            Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-[#80368D] underline"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#80368D] text-white py-3 rounded-lg font-semibold hover:bg-[#6a2d76] transition-colors disabled:opacity-50"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>

          <p className="text-sm text-gray-500 text-center">
            <Link href="/login" className="text-[#80368D] underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
