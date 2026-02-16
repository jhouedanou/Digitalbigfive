import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#1A1F2B] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-bold text-white">Big Five Agency</p>
            <p className="text-xs text-gray-400 mt-1">
              Ressources et produits digitaux pour le marketing
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Ressources
            </Link>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-white transition-colors">
              CGV
            </Link>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Big Five Agency. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
