import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/providers/SessionProvider";
import { ServiceWorkerProvider } from "@/components/pwa/ServiceWorkerProvider";
import PageTransitionBar from "@/components/layout/PageTransitionBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Five - Ressources & Produits Digitaux",
  description:
    "Découvrez nos ressources gratuites et produits digitaux premium pour booster votre stratégie marketing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Big Five",
    startupImage: [
      { url: "/icons/icon-512x512.svg" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#80368D",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport: Viewport = {
  themeColor: "#80368D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ServiceWorkerProvider>
            <PageTransitionBar />
            {children}
          </ServiceWorkerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

