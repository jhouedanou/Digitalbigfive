import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function MyProductsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "paid" },
    include: { resource: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mes produits</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            Vous n&apos;avez pas encore de produit.
          </p>
          <Link
            href="/?access=paid"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="aspect-[4/3] bg-gray-100">
                <img
                  src={order.resource.coverImage || "/placeholder.svg"}
                  alt={order.resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {order.resource.title}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Acheté le {formatDate(order.createdAt)}
                </p>
                <Link
                  href={`/dashboard/reader/${order.resource.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Lire en ligne
                </Link>
                {order.resource.allowDownload && (
                  <a
                    href={`/api/pdf/${order.resource.id}`}
                    className="block w-full mt-2 border border-gray-300 text-gray-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                    download
                  >
                    Télécharger
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
