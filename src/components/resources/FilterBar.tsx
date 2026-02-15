"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const FILTER_OPTIONS = {
  access: [
    { value: "", label: "Tous" },
    { value: "free", label: "Gratuit" },
    { value: "paid", label: "Payant" },
  ],
  category: [
    { value: "", label: "Toutes les catégories" },
    { value: "Social Media", label: "Social Media" },
    { value: "Publicité", label: "Publicité" },
    { value: "Data & Performance", label: "Data & Performance" },
    { value: "Stratégie", label: "Stratégie" },
    { value: "Formation", label: "Formation" },
  ],
  resourceType: [
    { value: "", label: "Tous les types" },
    { value: "Guide", label: "Guide" },
    { value: "Template", label: "Template" },
    { value: "Check-list", label: "Check-list" },
    { value: "Étude", label: "Étude" },
    { value: "Outil", label: "Outil" },
    { value: "Formation", label: "Formation" },
    { value: "E-book", label: "E-book" },
  ],
  level: [
    { value: "", label: "Tous les niveaux" },
    { value: "Débutant", label: "Débutant" },
    { value: "Intermédiaire", label: "Intermédiaire" },
    { value: "Avancé", label: "Avancé" },
  ],
  format: [
    { value: "", label: "Tous les formats" },
    { value: "PDF", label: "PDF" },
    { value: "Spreadsheet", label: "Spreadsheet" },
    { value: "Slides", label: "Slides" },
    { value: "Notion", label: "Notion" },
    { value: "Vidéo", label: "Vidéo" },
  ],
};

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(FILTER_OPTIONS).map(([key, options]) => (
        <select
          key={key}
          value={searchParams.get(key) || ""}
          onChange={(e) => updateFilter(key, e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
