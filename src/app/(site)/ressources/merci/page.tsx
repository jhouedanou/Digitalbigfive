import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Merci pour votre téléchargement !
      </h1>
      <p className="text-gray-600 mb-8">
        Vérifiez votre boîte email. Le lien de téléchargement expire dans 48
        heures.
      </p>
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Découvrir d&apos;autres ressources
        </Link>
        <p className="text-sm text-gray-500">
          Découvrez aussi nos{" "}
          <Link href="/?access=paid" className="text-blue-600 underline">
            produits premium
          </Link>
        </p>
      </div>
    </div>
  );
}
