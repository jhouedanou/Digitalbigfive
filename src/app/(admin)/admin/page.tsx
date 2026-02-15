"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Users,
  MessageSquare,
} from "lucide-react";

interface Stats {
  totalRevenue: number;
  monthlyOrders: number;
  totalOrders: number;
  totalContacts: number;
  pendingTestimonials: number;
  topProducts: { id: string; title: string; sales: number }[];
  topResources: { id: string; title: string; downloads: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  if (!stats) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Tableau de bord
      </h1>

      {/* Key stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-green-600" />
            <span className="text-sm text-gray-500">Revenus totaux</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={20} className="text-blue-600" />
            <span className="text-sm text-gray-500">Ventes ce mois</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.monthlyOrders}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.totalOrders} au total
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-purple-600" />
            <span className="text-sm text-gray-500">Contacts collectés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalContacts}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-yellow-600" />
            <span className="text-sm text-gray-500">Avis en attente</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.pendingTestimonials}
          </p>
        </div>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 produits vendus
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune vente</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2">{i + 1}.</span>
                    {p.title}
                  </span>
                  <span className="font-medium text-gray-900">
                    {p.sales} vente{p.sales > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 ressources téléchargées
          </h2>
          {stats.topResources.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun téléchargement</p>
          ) : (
            <ul className="space-y-3">
              {stats.topResources.map((r, i) => (
                <li
                  key={r.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2">{i + 1}.</span>
                    {r.title}
                  </span>
                  <span className="font-medium text-gray-900">
                    {r.downloads} DL
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
