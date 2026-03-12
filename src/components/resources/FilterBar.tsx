"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  key: string;
  placeholder: string;
  options: FilterOption[];
}

// Labels par défaut pour chaque groupe de filtres
const FILTER_LABELS: Record<string, string> = {
  access: "Tous",
  category: "Toutes les catégories",
  resourceType: "Tous les types",
  level: "Tous les niveaux",
  format: "Tous les formats",
};

// Le filtre "access" (Gratuit/Payant) est toujours statique
const STATIC_ACCESS_OPTIONS: FilterOption[] = [
  { value: "", label: "Tous" },
  { value: "free", label: "Gratuit" },
  { value: "paid", label: "Payant" },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { key: "access", placeholder: "Tous", options: STATIC_ACCESS_OPTIONS },
  ]);
  const [loading, setLoading] = useState(true);

  // Charger les filtres dynamiques depuis l'API
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/public/resources/filters");
        if (!res.ok) throw new Error("Erreur lors du chargement des filtres");

        const data: {
          categories: string[];
          resourceTypes: string[];
          levels: string[];
          formats: string[];
        } = await res.json();

        const groups: FilterGroup[] = [
          {
            key: "access",
            placeholder: FILTER_LABELS.access,
            options: STATIC_ACCESS_OPTIONS,
          },
        ];

        // Catégories
        if (data.categories.length > 0) {
          groups.push({
            key: "category",
            placeholder: FILTER_LABELS.category,
            options: [
              { value: "", label: FILTER_LABELS.category },
              ...data.categories.map((c) => ({ value: c, label: c })),
            ],
          });
        }

        // Types de ressource
        if (data.resourceTypes.length > 0) {
          groups.push({
            key: "resourceType",
            placeholder: FILTER_LABELS.resourceType,
            options: [
              { value: "", label: FILTER_LABELS.resourceType },
              ...data.resourceTypes.map((t) => ({ value: t, label: t })),
            ],
          });
        }

        // Niveaux
        if (data.levels.length > 0) {
          groups.push({
            key: "level",
            placeholder: FILTER_LABELS.level,
            options: [
              { value: "", label: FILTER_LABELS.level },
              ...data.levels.map((l) => ({ value: l, label: l })),
            ],
          });
        }

        // Formats
        if (data.formats.length > 0) {
          groups.push({
            key: "format",
            placeholder: FILTER_LABELS.format,
            options: [
              { value: "", label: FILTER_LABELS.format },
              ...data.formats.map((f) => ({ value: f, label: f })),
            ],
          });
        }

        setFilterGroups(groups);
      } catch (error) {
        console.error("Impossible de charger les filtres:", error);
        // En cas d'erreur, garder au moins le filtre access
      } finally {
        setLoading(false);
      }
    }

    fetchFilters();
  }, []);

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
    <div className="flex flex-wrap gap-3 items-center">
      {filterGroups.map(({ key, placeholder, options }) => (
        <select
          key={key}
          aria-label={placeholder}
          title={placeholder}
          value={searchParams.get(key) || ""}
          onChange={(e) => updateFilter(key, e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#80368D] focus:border-transparent transition-colors"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {loading && (
        <span className="text-xs text-gray-400 animate-pulse">
          Chargement des filtres…
        </span>
      )}

      {/* Bouton de réinitialisation si au moins un filtre est actif */}
      {Array.from(searchParams.entries()).length > 0 && (
        <button
          onClick={() => router.push("/")}
          className="text-sm text-[#80368D] hover:text-[#29358B] font-medium underline underline-offset-2 transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
