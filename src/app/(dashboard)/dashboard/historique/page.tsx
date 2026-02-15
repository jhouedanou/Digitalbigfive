import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { resource: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Historique des achats
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          Aucun achat pour le moment.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">
                  Date
                </th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">
                  Produit
                </th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">
                  Montant
                </th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.resource.title}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatPrice(order.amount, order.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "refunded"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status === "paid"
                        ? "Payé"
                        : order.status === "refunded"
                        ? "Remboursé"
                        : "En attente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
