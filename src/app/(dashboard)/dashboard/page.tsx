import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Receipt, Star } from "lucide-react";

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const [orderCount, testimonialCount] = await Promise.all([
    prisma.order.count({
      where: { userId: session.user.id, status: "paid" },
    }),
    prisma.testimonial.count({
      where: { userId: session.user.id },
    }),
  ]);

  // Recommended products (not yet purchased)
  const purchasedIds = (
    await prisma.order.findMany({
      where: { userId: session.user.id, status: "paid" },
      select: { resourceId: true },
    })
  ).map((o) => o.resourceId);

  const recommendations = await prisma.resource.findMany({
    where: {
      type: "paid",
      status: "published",
      id: { notIn: purchasedIds.length > 0 ? purchasedIds : ["none"] },
    },
    take: 3,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Bonjour {user?.firstName} !
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/produits"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={20} className="text-blue-600" />
            <span className="text-sm text-gray-500">Produits achetés</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{orderCount}</p>
        </Link>

        <Link
          href="/dashboard/historique"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <Receipt size={20} className="text-green-600" />
            <span className="text-sm text-gray-500">Commandes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{orderCount}</p>
        </Link>

        <Link
          href="/dashboard/avis"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <Star size={20} className="text-yellow-500" />
            <span className="text-sm text-gray-500">Avis laissés</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{testimonialCount}</p>
        </Link>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recommandé pour vous
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.map((product) => (
              <Link
                key={product.id}
                href={`/produits/${product.slug}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  <img
                    src={product.coverImage || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-blue-600 font-semibold mt-1 text-sm">
                    {product.price?.toFixed(2)} {product.currency}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
