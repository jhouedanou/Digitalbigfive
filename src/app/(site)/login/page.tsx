"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    } else {
      window.location.href = redirect;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe
        </label>
        <input
          name="password"
          type="password"
          required
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
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold text-[#29358B] mb-2 text-center">
        Connexion
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Accédez à votre espace client
      </p>

      <Suspense fallback={<div className="h-40" />}>
        <LoginForm />
      </Suspense>

      <p className="text-sm text-gray-500 text-center mt-6">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-[#80368D] underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
