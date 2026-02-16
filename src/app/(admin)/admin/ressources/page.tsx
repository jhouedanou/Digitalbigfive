"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  price: number | null;
  _count: { orders: number; downloads: number; testimonials: number };
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = filter ? `?type=${filter}` : "";
    fetch(`/api/resources${params}`)
      .then((res) => res.json())
      .then((data) => setResources(data))
      .catch(() => {});
  }, [filter]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette ressource ?")) return;
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    setResources(resources.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des ressources
        </h1>
        <Link
          href="/admin/ressources/new"
          className="flex items-center gap-2 bg-[#80368D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6a2d76]"
        >
          <Plus size={16} />
          Nouvelle ressource
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["", "free", "paid"].map((val) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === val
                ? "bg-[#80368D] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {val === "" ? "Tous" : val === "free" ? "Gratuit" : "Payant"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Titre
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Type
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Statut
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Prix
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Stats
              </th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {resources.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {r.title}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.type === "free"
                        ? "bg-green-100 text-green-700"
                        : "bg-[#D0E4F2] text-[#80368D]"
                    }`}
                  >
                    {r.type === "free" ? "Gratuit" : "Payant"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "published"
                        ? "bg-green-100 text-green-700"
                        : r.status === "archived"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.status === "published"
                      ? "Publié"
                      : r.status === "archived"
                      ? "Archivé"
                      : "Brouillon"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {r.price ? formatPrice(r.price) : "-"}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {r.type === "paid"
                    ? `${r._count.orders} vente(s)`
                    : `${r._count.downloads} DL`}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/ressources/${r.id}`}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} className="text-gray-500" />
                    </Link>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune ressource trouvée
          </div>
        )}
      </div>
    </div>
  );
}
