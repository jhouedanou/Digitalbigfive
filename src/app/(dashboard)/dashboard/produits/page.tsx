import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import ProductsClientWrapper from "./ProductsClientWrapper";

export default async function MyProductsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "paid" },
    include: { resource: true },
    orderBy: { createdAt: "desc" },
  });

  const productsData = orders.map((order) => ({
    id: order.id,
    resourceId: order.resource.id,
    title: order.resource.title,
    coverImage: order.resource.coverImage,
    purchaseDate: order.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
        
        {orders.length > 0 && (
          <Link
            href="/dashboard/bibliotheque"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-[#80368D] to-[#29358B] text-white rounded-lg hover:opacity-90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            📱 Installer l'app bibliothèque
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            Vous n&apos;avez pas encore de produit.
          </p>
          <Link
            href="/?access=paid"
            className="inline-block bg-[#80368D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6a2d76]"
          >
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <ProductsClientWrapper products={productsData} />
      )}
    </div>
  );
}
