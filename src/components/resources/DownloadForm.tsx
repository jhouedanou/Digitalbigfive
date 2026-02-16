"use client";

import { useState } from "react";

interface DownloadFormProps {
  resourceId: string;
}

export default function DownloadForm({ resourceId }: DownloadFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      organization: formData.get("organization") as string,
      jobTitle: formData.get("jobTitle") as string,
      gdprConsent: formData.get("gdprConsent") === "on",
      resourceId,
    };

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Une erreur est survenue");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Email envoyé !
        </h3>
        <p className="text-sm text-green-700">
          Vérifiez votre boîte mail. Le lien de téléchargement expire dans 48h.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <input
            name="firstName"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
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
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email professionnel *
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
          Organisation
        </label>
        <input
          name="organization"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fonction
        </label>
        <input
          name="jobTitle"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#80368D]"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          name="gdprConsent"
          required
          className="mt-1"
        />
        <label className="text-xs text-gray-500">
          J&apos;accepte de recevoir des communications par email. Mes données
          seront traitées conformément à la politique de confidentialité. *
        </label>
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
        {loading ? "Envoi en cours..." : "Télécharger gratuitement"}
      </button>
    </form>
  );
}
