"use client";

import { useEffect, useState } from "react";

export default function AdminTrackingPage() {
  const [settings, setSettings] = useState({
    meta_pixel_enabled: "false",
    meta_pixel_id: "",
    meta_capi_enabled: "false",
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

          <p className="text-xs text-gray-500">
            Les événements Purchase et CompleteRegistration seront envoyés
            côté serveur. Les données personnelles sont hashées (SHA256) avant
            envoi.
          </p>
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
