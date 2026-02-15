"use client";

import { useEffect, useState, use } from "react";
import ResourceForm from "@/components/admin/ResourceForm";

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resources/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500">Chargement...</div>;
  if (!resource) return <div className="text-red-500">Ressource introuvable</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Modifier la ressource
      </h1>
      <ResourceForm initialData={resource} />
    </div>
  );
}
