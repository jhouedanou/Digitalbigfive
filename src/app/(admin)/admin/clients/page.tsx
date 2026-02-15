"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Clients ({clients.length})
      </h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Nom complet
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Email
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Organisation
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Inscription
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Achats
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Total dépensé
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {c.firstName} {c.lastName}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.email}</td>
                <td className="px-6 py-4 text-gray-600">
                  {c.organization || "-"}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.orderCount}</td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {formatPrice(c.totalSpent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun client inscrit
          </div>
        )}
      </div>
    </div>
  );
}
