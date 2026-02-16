"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/SessionProvider";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  MessageSquare,
  BarChart3,
  LogOut,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/ressources", label: "Ressources", icon: FileText },
    { href: "/admin/contacts", label: "Contacts", icon: Users },
    { href: "/admin/clients", label: "Clients", icon: UserCheck },
    { href: "/admin/temoignages", label: "Témoignages", icon: MessageSquare },
    { href: "/admin/tracking", label: "Tracking", icon: BarChart3 },
  ];

  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-bold">
              Big Five Admin
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/admin" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={14} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-white"
            >
              Voir le site
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
