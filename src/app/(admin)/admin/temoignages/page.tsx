"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";

interface Testimonial {
  id: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  resource: { title: string };
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => setTestimonials(data))
      .catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/testimonials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTestimonials(
      testimonials.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    setTestimonials(testimonials.filter((t) => t.id !== id));
  }

  const filtered = testimonials.filter(
    (t) => filter === "all" || t.status === filter
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Modération des avis
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "pending", label: "En attente" },
          { value: "approved", label: "Approuvés" },
          { value: "rejected", label: "Rejetés" },
          { value: "all", label: "Tous" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === tab.value
                ? "bg-[#80368D] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {tab.value === "pending" && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {testimonials.filter((t) => t.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Testimonials list */}
      <div className="space-y-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.user.firstName} {t.user.lastName}
                  <span className="text-gray-400 font-normal ml-2">
                    {t.user.email}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Produit : {t.resource.title}
                </p>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i <= t.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mt-2">{t.text}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="flex gap-2">
                {t.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(t.id, "approved")}
                      className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-600"
                      title="Approuver"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => updateStatus(t.id, "rejected")}
                      className="p-1.5 bg-red-50 hover:bg-red-100 rounded text-red-600"
                      title="Rejeter"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteTestimonial(t.id)}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun avis dans cette catégorie
          </div>
        )}
      </div>
    </div>
  );
}
