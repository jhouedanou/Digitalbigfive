import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user) {
    return notFound();
  }

  const order = await prisma.order.findFirst({
    where: { 
      id,
      userId: session.user.id,
      status: "paid",
    },
    include: { 
      resource: { 
        select: { 
          title: true, 
          shortDescription: true,
          category: true,
          resourceType: true,
        } 
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          organization: true,
        }
      }
    },
  });

  if (!order) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reçu de paiement</h1>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors print:hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer
        </button>
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden print:shadow-none print:border-0">
        {/* Header with logo */}
        <div className="bg-gradient-to-r from-[#80368D] to-[#29358B] px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Big Five Agency</h2>
              <p className="text-white/80 text-sm">Ressources digitales premium</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">N° de commande</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">Paiement confirmé</span>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
              <p className="font-semibold text-gray-900">
                {order.user.firstName} {order.user.lastName}
              </p>
              <p className="text-gray-600">{order.user.email}</p>
              {order.user.organization && (
                <p className="text-gray-600">{order.user.organization}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Date d&apos;achat</h3>
              <p className="font-semibold text-gray-900">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Product */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">Détail de l&apos;achat</h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {order.resource.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {order.resource.category} • {order.resource.resourceType}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatPrice(order.amount, order.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total payé</span>
            <span className="text-2xl font-bold text-[#80368D]">
              {formatPrice(order.amount, order.currency)}
            </span>
          </div>

          {/* Reference */}
          {order.paytechPaymentRef && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Référence de paiement : {order.paytechPaymentRef}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Ce reçu est généré automatiquement et constitue une preuve de paiement.
            <br />
            Big Five Agency • Abidjan, Côte d&apos;Ivoire • contact@bigfive.agency
          </p>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-8 text-center print:hidden">
        <Link
          href="/dashboard/historique"
          className="text-[#80368D] hover:underline"
        >
          ← Retour à l&apos;historique
        </Link>
      </div>
    </div>
  );
}
