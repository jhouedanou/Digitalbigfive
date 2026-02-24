"use client";

import { useEffect, useState } from "react";

export default function AdminTrackingPage() {
  const [settings, setSettings] = useState({
    meta_pixel_enabled: "true",
    meta_pixel_id: "",
    meta_capi_enabled: "true",
    meta_capi_token: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setLoading(true);
    setSuccess(false);

    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Tracking publicitaire
      </h1>

      <div className="max-w-xl space-y-6">
        {/* Meta Pixel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Meta Pixel</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.meta_pixel_enabled === "true"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  meta_pixel_enabled: e.target.checked ? "true" : "false",
                })
              }
            />
            Activer le Meta Pixel
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID du Pixel Meta
            </label>
            <input
              value={settings.meta_pixel_id}
              onChange={(e) =>
                setSettings({ ...settings, meta_pixel_id: e.target.value })
              }
              placeholder="1234567890"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* CAPI */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Conversion API (CAPI)</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.meta_capi_enabled === "true"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  meta_capi_enabled: e.target.checked ? "true" : "false",
                })
              }
            />
            Activer CAPI
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token CAPI
            </label>
            <input
              value={settings.meta_capi_token}
              onChange={(e) =>
                setSettings({ ...settings, meta_capi_token: e.target.value })
              }
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="text-xs text-gray-500">
            Les données personnelles sont hashées (SHA256) avant envoi.
            Chaque événement est dédupliqué avec le Pixel via un eventId commun.
          </div>
        </div>

        {/* État des événements */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">État des événements</h2>
          <p className="text-xs text-gray-500 mb-2">
            Tous les événements sont activés automatiquement dès que le Pixel et/ou CAPI sont configurés.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                name: "PageView",
                desc: "Toutes les pages (automatique via PixelLoader)",
                channel: "Pixel",
              },
              {
                name: "ViewContent",
                desc: "Pages produit / ressources",
                channel: "Pixel + CAPI",
              },
              {
                name: "InitiateCheckout",
                desc: "Début de paiement (clic Acheter)",
                channel: "Pixel + CAPI",
              },
              {
                name: "Purchase",
                desc: "Achat confirmé (webhook paiement)",
                channel: "CAPI",
              },
              {
                name: "CompleteRegistration",
                desc: "Inscription d'un nouveau compte",
                channel: "Pixel + CAPI",
              },
              {
                name: "Lead",
                desc: "Formulaire de contact",
                channel: "CAPI",
              },
            ].map((evt) => {
              const pixelOk =
                settings.meta_pixel_enabled === "true" &&
                !!settings.meta_pixel_id;
              const capiOk =
                settings.meta_capi_enabled === "true" &&
                !!settings.meta_capi_token &&
                !!settings.meta_pixel_id;
              const isPixelEvent =
                evt.channel === "Pixel" || evt.channel.includes("Pixel");
              const isCapiEvent = evt.channel.includes("CAPI");
              const active =
                (isPixelEvent && pixelOk) || (isCapiEvent && capiOk);

              return (
                <div
                  key={evt.name}
                  className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
                    active
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div>
                    <span className="font-semibold">{evt.name}</span>
                    <span className="text-gray-500 ml-2">— {evt.desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {active ? "✅ Actif" : "⚠️ Inactif"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {evt.channel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {success && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3">
            Configuration sauvegardée avec succès.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#80368D] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#6a2d76] disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
