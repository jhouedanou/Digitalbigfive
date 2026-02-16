"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import { LayoutDashboard, BookOpen, Receipt, User, Star, LogOut, Library } from "lucide-react";

interface DashboardNavProps {
  user: { name: string; role: string };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const links = [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { href: "/dashboard/produits", label: "Mes produits", icon: BookOpen },
    { href: "/dashboard/bibliotheque", label: "Bibliothèque", icon: Library },
    { href: "/dashboard/historique", label: "Historique", icon: Receipt },
    { href: "/dashboard/avis", label: "Mes avis", icon: Star },
    { href: "/dashboard/profil", label: "Profil", icon: User },
  ];

  if (user.role === "admin") {
    links.push({ href: "/admin", label: "Admin", icon: LayoutDashboard });
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            Big Five
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#D0E4F2] text-[#80368D]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
