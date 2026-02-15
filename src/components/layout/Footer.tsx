import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Big Five Agency</p>
            <p className="text-xs text-gray-500 mt-1">
              Ressources et produits digitaux pour le marketing
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              Ressources
            </Link>
            <Link href="/mentions-legales" className="hover:text-gray-900">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-gray-900">
              CGV
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Big Five Agency. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
