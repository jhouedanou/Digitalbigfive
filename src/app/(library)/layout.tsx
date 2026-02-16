import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ma Bibliothèque | Digital Big Five",
  description: "Votre bibliothèque de ressources numériques - Lisez vos PDFs hors ligne",
  manifest: "/manifest-library.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ma Bibliothèque",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2937",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/library-icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.className} bg-gray-900 antialiased`}>
        {children}
        
        {/* Register library service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw-library.js').then(function(reg) {
                  console.log('Library SW registered:', reg.scope);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
