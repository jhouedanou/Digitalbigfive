"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ResourceCard from "./ResourceCard";

interface Resource {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImage: string;
  type: string;
  category: string;
  level: string;
  resourceType: string;
  price?: number | null;
  originalPrice?: number | null;
  currency?: string;
}

interface ResourceGridProps {
  initialResources: Resource[];
  total: number;
  initialHasMore: boolean;
  filterParams: string;
}

const PAGE_SIZE = 6;

export default function ResourceGrid({
  initialResources,
  total,
  initialHasMore,
  filterParams,
}: ResourceGridProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const skip = resources.length;
      const separator = filterParams ? "&" : "";
      const res = await fetch(
        `/api/public/resources?skip=${skip}&take=${PAGE_SIZE}${separator}${filterParams}`
      );
      const data = await res.json();

      setResources((prev) => [...prev, ...data.resources]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [resources.length, hasMore, loading, filterParams]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      {/* Results count */}
      <div className="mb-6 text-sm text-gray-500">
        {total} résultat{total !== 1 ? "s" : ""}
      </div>

      {resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                id={resource.id}
                slug={resource.slug}
                title={resource.title}
                shortDescription={resource.shortDescription}
                coverImage={resource.coverImage}
                type={resource.type}
                category={resource.category}
                level={resource.level}
                resourceType={resource.resourceType}
                price={resource.price}
                originalPrice={resource.originalPrice}
                currency={resource.currency}
              />
            ))}
          </div>

          {/* Sentinel + loader */}
          {hasMore && (
            <div ref={sentinelRef} className="mt-10 flex justify-center py-8">
              {loading && (
                <svg
                  className="animate-spin h-8 w-8 text-[#29358B]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Aucune ressource ne correspond à vos critères.
          </p>
          <p className="text-gray-400 mt-2">
            Essayez de modifier vos filtres pour voir plus de résultats.
          </p>
        </div>
      )}
    </>
  );
}
