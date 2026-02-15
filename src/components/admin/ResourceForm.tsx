"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResourceData {
  id?: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  type: string;
  category: string;
  resourceType: string;
  level: string;
  format: string;
  coverImage: string;
  filePath: string;
  fileSize: string;
  pageCount: number | null;
  estimatedTime: string;
  status: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  sku: string;
  allowDownload: boolean;
  enableWatermark: boolean;
}

const EMPTY: ResourceData = {
  title: "",
  shortDescription: "",
  longDescription: "",
  type: "free",
  category: "Social Media",
  resourceType: "Guide",
  level: "Débutant",
  format: "PDF",
  coverImage: "",
  filePath: "",
  fileSize: "",
  pageCount: null,
  estimatedTime: "",
  status: "draft",
  price: null,
  originalPrice: null,
  currency: "EUR",
  sku: "",
  allowDownload: false,
  enableWatermark: true,
};

const CATEGORIES = [
  "Social Media",
  "Publicité",
  "Data & Performance",
  "Stratégie",
  "Formation",
];
const RESOURCE_TYPES = [
  "Guide",
  "Template",
  "Check-list",
  "Étude",
  "Outil",
  "Formation",
  "E-book",
];
const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
const FORMATS = ["PDF", "Spreadsheet", "Slides", "Notion", "Vidéo"];

export default function ResourceForm({
  initialData,
}: {
  initialData?: ResourceData;
}) {
  const router = useRouter();
  const [data, setData] = useState<ResourceData>(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData?.id;

  function update(field: string, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEditing
      ? `/api/resources/${initialData!.id}`
      : "/api/resources";

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      router.push("/admin/ressources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Type selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Type de ressource</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="free"
              checked={data.type === "free"}
              onChange={() => update("type", "free")}
              className="text-blue-600"
            />
            <span className="text-sm">Ressource gratuite</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="paid"
              checked={data.type === "paid"}
              onChange={() => update("type", "paid")}
              className="text-blue-600"
            />
            <span className="text-sm">Produit payant</span>
          </label>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Informations générales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre *
          </label>
          <input
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description courte *
          </label>
          <input
            value={data.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description longue (HTML) *
          </label>
          <textarea
            value={data.longDescription}
            onChange={(e) => update("longDescription", e.target.value)}
            required
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={data.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de ressource
            </label>
            <select
              value={data.resourceType}
              onChange={(e) => update("resourceType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              value={data.level}
              onChange={(e) => update("level", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={data.format}
              onChange={(e) => update("format", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Fichiers</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image de couverture (URL ou chemin)
          </label>
          <input
            value={data.coverImage}
            onChange={(e) => update("coverImage", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="/uploads/cover-image.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chemin du fichier
          </label>
          <input
            value={data.filePath}
            onChange={(e) => update("filePath", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="/uploads/resource.pdf"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taille du fichier
            </label>
            <input
              value={data.fileSize}
              onChange={(e) => update("fileSize", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="2.5 MB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de pages
            </label>
            <input
              type="number"
              value={data.pageCount || ""}
              onChange={(e) =>
                update("pageCount", e.target.value ? Number(e.target.value) : null)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temps estimé
            </label>
            <input
              value={data.estimatedTime}
              onChange={(e) => update("estimatedTime", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="15 min"
            />
          </div>
        </div>
      </div>

      {/* Paid-only fields */}
      {data.type === "paid" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Produit payant</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix *
              </label>
              <input
                type="number"
                step="0.01"
                value={data.price || ""}
                onChange={(e) =>
                  update("price", e.target.value ? Number(e.target.value) : null)
                }
                required={data.type === "paid"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix barré (promo)
              </label>
              <input
                type="number"
                step="0.01"
                value={data.originalPrice || ""}
                onChange={(e) =>
                  update(
                    "originalPrice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                value={data.sku}
                onChange={(e) => update("sku", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.allowDownload}
                onChange={(e) => update("allowDownload", e.target.checked)}
              />
              Autoriser le téléchargement
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.enableWatermark}
                onChange={(e) => update("enableWatermark", e.target.checked)}
              />
              Activer le watermark
            </label>
          </div>
        </div>
      )}

      {/* Status & Submit */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Publication</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={data.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Enregistrement..."
            : isEditing
            ? "Mettre à jour"
            : "Créer"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
