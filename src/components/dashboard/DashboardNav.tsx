"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import { LayoutDashboard, BookOpen, Receipt, User, Star, LogOut, Library, ChevronDown } from "lucide-react";
import { useState } from "react";

interface DashboardNavProps {
  user: { name: string; email?: string; role: string };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const links = [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { href: "/dashboard/produits", label: "Mes produits", icon: BookOpen },
   /*  { href: "/dashboard/bibliotheque", label: "Bibliothèque", icon: Library }, */
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

          {/* User info dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user.name || "Utilisateur"}
                </p>
                {user.email && (
                  <p className="text-xs text-gray-500 leading-tight truncate max-w-[150px]">
                    {user.email}
                  </p>
                )}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <div className="p-4 bg-gradient-to-br from-[#80368D]/10 to-[#29358B]/10 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.name || "Utilisateur"}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        )}
                        {user.role === "admin" && (
                          <span className="inline-block mt-1 text-xs bg-[#80368D] text-white px-2 py-0.5 rounded-full">
                            Administrateur
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard/profil"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <User size={16} />
                      Mon profil
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
