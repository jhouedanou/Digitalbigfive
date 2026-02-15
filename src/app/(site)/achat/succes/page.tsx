import Link from "next/link";

export default function PurchaseSuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Merci pour votre achat !
      </h1>
      <p className="text-gray-600 mb-8">
        Votre commande a été confirmée. Vous pouvez accéder à votre produit
        depuis votre espace client.
      </p>
      <Link
        href="/dashboard/produits"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
      >
        Accéder à mes produits
      </Link>
    </div>
  );
}
