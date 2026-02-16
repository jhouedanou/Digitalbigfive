import Link from "next/link";

export default function PurchaseCancelledPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6 text-orange-500">!</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Paiement annulé
      </h1>
      <p className="text-gray-600 mb-8">
        Votre paiement a été annulé. Aucun montant n&apos;a été débité.
        Vous pouvez réessayer à tout moment.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/produits"
          className="inline-block bg-[#80368D] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#6a2d76] transition-colors"
        >
          Retour aux produits
        </Link>
        <Link
          href="/dashboard"
          className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Mon espace
        </Link>
      </div>
    </div>
  );
}
