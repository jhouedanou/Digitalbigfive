import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { resource: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Historique des achats
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">Aucun achat pour le moment.</p>
          <Link 
            href="/"
            className="inline-block bg-[#80368D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6a2d76]"
          >
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {order.resource.title}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status === "paid"
                        ? "Payé"
                        : order.status === "cancelled"
                        ? "Annulé"
                        : "En attente"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>N° {order.id.slice(0, 12)}...</span>
                    <span>{formatDate(order.createdAt)}</span>
                    <span className="font-semibold text-[#80368D]">
                      {formatPrice(order.amount, order.currency)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {order.status === "paid" && (
                    <>
                      <Link
                        href={`/dashboard/reader/${order.resource.id}`}
                        className="bg-[#80368D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6a2d76] transition-colors"
                      >
                        Lire
                      </Link>
                      <Link
                        href={`/dashboard/recu/${order.id}`}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Voir le reçu
                      </Link>
                    </>
                  )}
                  {order.status === "pending" && (
                    <span className="text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                      Paiement en attente de confirmation
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
