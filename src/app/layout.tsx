import type { Metadata } from "next";
import AuthProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Five - Ressources & Produits Digitaux",
  description:
    "Découvrez nos ressources gratuites et produits digitaux premium pour booster votre stratégie marketing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

