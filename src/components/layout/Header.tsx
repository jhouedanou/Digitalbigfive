"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/SessionProvider";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const links = [
    { href: "/", label: "Ressources" },
  ];

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Big Five</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Ressources
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Indicateur de connexion */}
            {loading ? (
              <span className="text-xs text-gray-400">…</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Mon espace
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User size={16} />
                Espace client
              </Link>
            )}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!loading && (
              user ? (
                <div className="flex items-center gap-3 py-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-sm font-medium text-green-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Mon espace
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block py-2 text-sm text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  Espace client
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </header>
  );
}
